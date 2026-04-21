import { Inject, Injectable, Logger } from "@nestjs/common"
import { InjectFlowProducer } from "@nestjs/bullmq"
import type { FlowChildJob } from "bullmq"
import { FlowProducer } from "bullmq"

import { QueuedPaintingTypes } from "../di/Types.js"
import type {
   IRegionMap,
   IRegionMapRepository,
} from "../../../plotting/index.js"
import type {
   CIDString,
   LiteCIDString,
   ULIDString,
} from "../../../messages/index.js"
import {
   CURRENT_RELEASE,
   WORKLOAD_RANDOM_ART,
} from "../../messages/dto/index.js"
import type {
   PartialPaintRequest,
   GatherPaintedPartsRequest,
   GatherProjectTasksRequest,
   MultiPaintingProjectReply,
   MultiTaskRequestModel,
} from "../../messages/dto/index.js"

import type {
   CanvasFragment,
   GenModelSeed,
   PaintTaskId,
   PaintingTask,
   PlotDataCIDRef,
   PlotDataRef,
   PlotMapGeometry,
   ValidPaintGeometry,
} from "../../messages/values/index.js"
import { isRefByName } from "../../messages/values/PlotDataRef.js"

import { CIDUtil } from "../../utility/CIDUtil.js"
import { Envelope } from "../../../messages/index.js"
import { NominalUtil } from "../../messages/components/NominalUtil.js"
import { MultiTaskSimpleGatherFlowConfiguration } from "./FlowConfiguration.js"

/**
 * Resolved RegionMap data after CID validation and repository lookup.
 */
interface ResolvedRegionMap {
   cidRef: PlotDataCIDRef
   geometry: ValidPaintGeometry
}

/**
 * Orchestrates painting workflows by:
 * 1. Validating CIDs and resolving RegionMaps
 * 2. Assigning ULIDs to projects and tasks
 * 3. Computing chunk divisions based on geometry
 * 4. Enqueueing jobs to BullMQ with full task data in payloads
 */
@Injectable()
export class RandomArtFlowProducer<
   PaintingDomain extends object,
   ProjectDomain extends object = never,
> {
   private readonly logger: Logger

   constructor(
      @InjectFlowProducer("paintFlows")
      private readonly flowProducer: FlowProducer,
      @Inject(QueuedPaintingTypes.FlowProducerConfig)
      private readonly config: MultiTaskSimpleGatherFlowConfiguration,
      @Inject(QueuedPaintingTypes.InjectedRegionMapRepo)
      private readonly regionMapRepo: IRegionMapRepository,
   ) {
      this.logger = new Logger(RandomArtFlowProducer.name)
      this.logger.log("RandomArtFlowProducer initialized")
   }

   /**
    * Submit a multi-task painting project for execution.
    *
    * This method:
    * 1. Validates all CIDs in the request
    * 2. Resolves RegionMaps from repository to get geometry
    * 3. Creates envelope-wrapped job data with proper trace identifiers
    * 4. Enqueues jobs to BullMQ with chunking strategy
    * 5. Returns reply with assigned ULIDs (index-parallel to input)
    *
    * All jobs in the flow share the same correlationId for distributed tracing.
    * Each job has a unique messageId and causationId pointing to its parent
    * in the trace tree.
    *
    * @param request The multi-task project request
    * @returns Reply with assigned project and task ULIDs
    */
   async submitProject(
      request: MultiTaskRequestModel<PaintingDomain, ProjectDomain>,
   ): Promise<MultiPaintingProjectReply> {
      const startTime = Date.now()

      // Step 1: Validate and resolve all unique RegionMaps
      const resolvedMaps: Map<string, ResolvedRegionMap> =
         await this.resolveRegionMaps(request.regionMapNames)

      // Step 2: Create root project envelope and payload - its trace becomes the
      // correlation root if (since) none was provided.
      const projectEnvelope: Envelope<
         GatherProjectTasksRequest<ProjectDomain>
      > = Envelope.createEnvelope(WORKLOAD_RANDOM_ART, CURRENT_RELEASE)

      // The project's messageId serves as both projectId and correlationId
      const projectId: ULIDString = projectEnvelope.trace.messageId
      const expectedTaskCount: number = request.taskUnits.length
      projectEnvelope.commitBody({
         projectId,
         expectedTaskCount,
         projectDomain: request.projectDomain,
      })
      this.logger.log(
         `Project ${projectId}: Processing ${expectedTaskCount} tasks`,
      )

      // Step 3: Process tasks and prepare pending tasks
      const taskIds: PaintTaskId[] = Array(request.taskUnits.length)
      const flowChildren: FlowChildJob[] = Array(request.taskUnits.length)

      for (let i = 0; i < request.taskUnits.length; i++) {
         const taskUnit: PaintingTask<PaintingDomain, PlotDataRef> =
            request.taskUnits[i]

         // Resolve the RegionMap for this task
         let resolved: ResolvedRegionMap | undefined
         if (isRefByName(taskUnit.plotDataRef)) {
            const regionMapName = taskUnit.plotDataRef.regionMapName
            resolved = resolvedMaps.get(regionMapName)
         } else {
            const regionMapCidStr = taskUnit.plotDataRef.regionMapCID
            resolved = resolvedMaps.get(regionMapCidStr)
            if (resolved == null) {
               resolved = await this.maybeLookupRegionMap(
                  regionMapCidStr,
                  taskUnit.plotDataRef.regionMapName,
               )
               resolvedMaps.set(regionMapCidStr, resolved)
            }
         }
         if (resolved === undefined) {
            const refStr: string = JSON.stringify(taskUnit.plotDataRef)
            throw new Error(
               `Task ${i}: RegionMap "${refStr}" could not be located`,
            )
         }

         // Create BullMQ flow child for this task
         const { taskId, flowChild } = this.createTaskFlowChildren(
            taskUnit.genSeed,
            resolved,
            taskUnit.domainExtension,
            projectEnvelope,
         )

         // Task data is in the BullMQ flow payload - no separate cache needed
         taskIds[i] = taskId
         flowChildren[i] = flowChild
      }

      // Step 4: Enqueue the flow
      await this.flowProducer.add({
         name: `project:${projectId}`,
         queueName: this.config.gatherTasksQueue,
         data: projectEnvelope,
         children: flowChildren,
      })

      const elapsedMs = Date.now() - startTime
      this.logger.log(
         `Project ${projectId}: Enqueued ${taskIds.length} tasks in ${elapsedMs}ms`,
      )

      // Step 6: Return reply with assigned ULIDs
      return {
         projectId,
         taskIds,
         acceptedAt: startTime,
         taskCount: expectedTaskCount,
      }
   }

   /**
    * Create BullMQ flow child for a single task, applying chunking strategy.
    *
    * Each job uses Envelope for proper trace management:
    * - correlationId: inherited from project trace
    * - causationId: points to parent message in trace tree
    * - messageId: auto-generated unique identifier
    *
    * @param task The pending task data
    * @param geometry The resolved geometry
    * @param projectTrace The project's trace (for creating child traces)
    * @returns Object with taskId and the flow child job
    */
   private createTaskFlowChildren(
      genSeed: GenModelSeed,
      resolvedRegionMap: ResolvedRegionMap,
      paintingExtension: PaintingDomain,
      projectEnvelope: Envelope<GatherProjectTasksRequest<ProjectDomain>>,
   ): { taskId: PaintTaskId; flowChild: FlowChildJob } {
      const { pixelWidth: pixelWidth, pixelHeight: pixelHeight } =
         resolvedRegionMap.geometry.imageSize
      const totalPixels = pixelWidth * pixelHeight

      // Calculate number of chunks needed
      const chunkCount = Math.max(
         1,
         Math.ceil(totalPixels / this.config.pixelsPerJob),
      )
      const rowsPerChunk = Math.ceil(pixelHeight / chunkCount)

      // Create the gather envelope first - its trace becomes parent for chunks
      // The gather envelope's messageId also serves as the taskId
      const gatherEnvelope: Envelope<
         GatherPaintedPartsRequest<PaintingDomain, ProjectDomain>
      > =
         projectEnvelope.startReplying<
            GatherPaintedPartsRequest<PaintingDomain, ProjectDomain>
         >()

      const taskId: PaintTaskId = gatherEnvelope.messageId
      const projectId: ULIDString = gatherEnvelope.correlationId

      // Commit the gather envelope payload
      gatherEnvelope.commitBody({
         taskId,
         projectId,
         paintTask: {
            genSeed,
            plotDataRef: resolvedRegionMap.cidRef,
            domainExtension: paintingExtension,
         },
         paintGeometry: resolvedRegionMap.geometry,
         expectedPartCount: chunkCount,
      })

      this.logger.debug(
         `Task ${taskId}: ${pixelWidth}x${pixelHeight} → ${chunkCount} chunks of ~${rowsPerChunk} rows`,
      )

      // Create scatter jobs for each chunk as children of the gather envelope
      const scatterJobs: FlowChildJob[] = new Array(chunkCount)
      for (let ii = 0; ii < chunkCount; ii++) {
         const firstRow = ii * rowsPerChunk
         const lastRow = Math.min(firstRow + rowsPerChunk - 1, pixelHeight - 1)

         const canvasFragment: CanvasFragment = {
            fragmentIndex: ii,
            totalFragmentsCount: chunkCount,
            fragmentFirstRow: firstRow,
            fragmentLastRow: lastRow,
            pixelSize: resolvedRegionMap.geometry.imageSize.pixelSize,
         }
         scatterJobs[ii] = this.createPaintPartJob(
            genSeed,
            resolvedRegionMap,
            canvasFragment,
            gatherEnvelope,
         )
      }

      // Return the gather job with its scatter children
      return {
         taskId,
         flowChild: {
            name: `gather:${taskId}`,
            queueName: this.config.gatherPartsQueue,
            data: gatherEnvelope,
            children: scatterJobs,
         },
      }
   }

   private createPaintPartJob(
      genSeed: GenModelSeed,
      resolvedRegionMap: ResolvedRegionMap,
      canvasFragment: CanvasFragment,
      gatherEnvelope: Envelope<
         GatherPaintedPartsRequest<PaintingDomain, ProjectDomain>
      >,
   ): FlowChildJob {
      const taskId: PaintTaskId = gatherEnvelope.messageId
      const projectId: ULIDString = gatherEnvelope.correlationId

      // Create chunk envelope as child of gather envelope
      const chunkEnvelope: Envelope<PartialPaintRequest> =
         gatherEnvelope.startReplying<PartialPaintRequest>()

      chunkEnvelope.commitBody({
         taskId,
         projectId,
         genSeed,
         plotDataRef: resolvedRegionMap.cidRef,
         canvasFragment,
      })

      return {
         name: `chunk:${taskId}:${canvasFragment.fragmentIndex}`,
         queueName: this.config.scatterPartsQueue,
         data: chunkEnvelope,
      }
   }

   private async maybeLookupRegionMap(
      cidStr: LiteCIDString | CIDString,
      name?: string,
   ): Promise<ResolvedRegionMap> {
      // Presume liteCid is parsable and load RegionMap from repository
      let regionMap: IRegionMap
      try {
         const cid = CIDUtil.maybeToCID(cidStr)
         regionMap = await this.regionMapRepo.load(cid)
      } catch (error) {
         throw new Error(
            `RegionMap${name == null ? ' "' : ""}${name ?? ""}${name == null ? '"' : ""}: Failed to load CID "${cidStr}": ${(error as Error).message}`,
            { cause: error },
         )
      }

      // Extract geometry from loaded RegionMap
      // Type assertions needed: IRegionMap returns plain numbers,
      // but PlotMapGeometry uses nominal types for type safety
      const geometry: PlotMapGeometry = {
         boundary: regionMap.regionBoundary,
         imageSize: {
            pixelWidth: regionMap.pixelWidth,
            pixelHeight: regionMap.pixelHeight,
            pixelSize: regionMap.pixelSize,
         },
      }
      NominalUtil.assertValidPaintGeometry(geometry)

      // We can trust any liteCid now because it was used to successfully load
      // the regionMap geometry.
      CIDUtil.trustCID(cidStr)
      const cidRef: PlotDataCIDRef = {
         regionMapCID: cidStr,
         regionMapName: name,
         isValidated: true,
      }
      return { cidRef, geometry }
   }

   /**
    * Validate CIDs and resolve RegionMaps from repository.
    *
    * @param regionMapNames Map of friendly names to LiteCIDStrings and or CIDStrings
    * @returns Map of friendly names to resolved RegionMap data
    */
   private async resolveRegionMaps(
      regionMapNames: Record<string, LiteCIDString>,
   ): Promise<Map<string, ResolvedRegionMap>> {
      const resolved = new Map<string, ResolvedRegionMap>()

      for (const [name, liteCid] of Object.entries(regionMapNames)) {
         const resolvedRegionMap: ResolvedRegionMap =
            await this.maybeLookupRegionMap(liteCid, name)
         resolved.set(name, resolvedRegionMap)
         resolved.set(liteCid, resolvedRegionMap)
         this.logger.debug(
            `RegionMap "${name}": Resolves to ${liteCid} with ${JSON.stringify(resolvedRegionMap.geometry)}`,
         )
      }

      return resolved
   }
}
