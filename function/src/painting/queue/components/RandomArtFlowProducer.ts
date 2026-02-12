import { Inject, Injectable, Logger } from "@nestjs/common"
import { InjectFlowProducer } from "@nestjs/bullmq"
import type { FlowChildJob } from "bullmq"
import { FlowProducer } from "bullmq"

import type {
   IRegionMap,
   IRegionMapRepository,
} from "../../../plotting/index.js"
import type {
   LiteCIDString,
   PaintGeometry,
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

import type { CanvasFragment } from "../../messages/values/CanvasFragment.js"
import type { PaintTaskId } from "../../messages/values/PaintTaskId.js"
import type { PaintingTask } from "../../messages/values/PaintingTask.js"
import {
   type PlotDataNameRef,
   type PlotDataCIDRef,
} from "../../messages/values/PlotDataRef.js"
import type { PlotMapGeometry } from "../../messages/values/PlotMapGeometry.js"
import type { PendingTask } from "../../cache/PendingTask.js"

import { CIDUtil } from "../../utility/CIDUtil.js"
import { Envelope, NominalUtil } from "../../../messages/index.js"
import { QueuedPaintingTypes } from "../di/Types.js"
import { FlowConfiguration } from "./FlowConfiguration.js"

/**
 * Resolved RegionMap data after CID validation and repository lookup.
 */
interface ResolvedRegionMap {
   cidRef: PlotDataCIDRef
   geometry: PaintGeometry
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
      private readonly config: FlowConfiguration,
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
      const taskIds: PaintTaskId[] = []
      const flowChildren: FlowChildJob[] = []

      for (let i = 0; i < request.taskUnits.length; i++) {
         const taskUnit: PaintingTask<PaintingDomain, PlotDataNameRef> =
            request.taskUnits[i]

         // Resolve the RegionMap for this task
         const regionMapName = taskUnit.plotDataRef.regionMapName
         if (regionMapName === undefined) {
            throw new Error(`Task ${i}: plotDataRef.regionMapName is required`)
         }

         const resolved = resolvedMaps.get(regionMapName)
         if (resolved === undefined) {
            throw new Error(
               `Task ${i}: RegionMap "${regionMapName}" not found in resolved maps`,
            )
         }

         // Create the pending task with validated CID and geometry
         const pendingTask: PendingTask<PaintingDomain> = {
            ...taskUnit,
            plotDataRef: resolved.cidRef,
            paintGeometry: resolved.geometry,
         }

         // Create BullMQ flow child for this task
         const { taskId, flowChild } = this.createTaskFlowChildren(
            pendingTask,
            projectEnvelope,
         )

         // Task data is in the BullMQ flow payload - no separate cache needed
         taskIds.push(taskId)
         flowChildren.push(flowChild)
      }

      // Step 4: Enqueue the flow
      await this.flowProducer.add({
         name: `project:${projectId}`,
         queueName: this.config.gatherProjectQueue,
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
    * Validate CIDs and resolve RegionMaps from repository.
    *
    * @param regionMapNames Map of friendly names to LiteCIDStrings
    * @returns Map of friendly names to resolved RegionMap data
    */
   private async resolveRegionMaps(
      regionMapNames: Record<string, LiteCIDString>,
   ): Promise<Map<string, ResolvedRegionMap>> {
      const resolved = new Map<string, ResolvedRegionMap>()

      for (const [name, liteCid] of Object.entries(regionMapNames)) {
         // Presume liteCid is parsable and load RegionMap from repository
         const regionMap: IRegionMap = await (async () => {
            try {
               const cid = CIDUtil.parseCID(liteCid)
               return await this.regionMapRepo.load(cid)
            } catch (error) {
               throw new Error(
                  `RegionMap "${name}": Failed to load CID "${liteCid}": ${(error as Error).message}`,
                  { cause: error },
               )
            }
         })()

         // Extract geometry from loaded RegionMap
         // Type assertions needed: IRegionMap returns plain numbers,
         // but PlotMapGeometry uses nominal types for type safety
         const geometry: PlotMapGeometry = {
            boundary: regionMap.regionBoundary,
            imageSize: {
               width: regionMap.pixelWidth,
               height: regionMap.pixelHeight,
               size: regionMap.pixelSize,
            },
         }
         NominalUtil.blessGeometry(geometry)
         CIDUtil.trustCID(liteCid)
         const cidRef: PlotDataCIDRef = {
            regionMapCID: liteCid,
            regionMapName: name,
         }
         resolved.set(name, { cidRef, geometry })
         this.logger.debug(
            `RegionMap "${name}": Resolves to ${liteCid} with ${JSON.stringify(geometry)}`,
         )
      }

      return resolved
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
      task: PendingTask<PaintingDomain>,
      projectEnvelope: Envelope<GatherProjectTasksRequest<ProjectDomain>>,
   ): { taskId: PaintTaskId; flowChild: FlowChildJob } {
      const { width: pixelWidth, height: pixelHeight } =
         task.paintGeometry.imageSize
      const totalPixels = pixelWidth * pixelHeight
      const pixelsPerChunk = this.config.pixelsPerTask

      // Calculate number of chunks needed
      const chunkCount = Math.max(1, Math.ceil(totalPixels / pixelsPerChunk))
      const rowsPerChunk = Math.ceil(pixelHeight / chunkCount)

      // Create the gather envelope first - its trace becomes parent for chunks
      // The gather envelope's messageId also serves as the taskId
      const gatherEnvelope =
         projectEnvelope.startReplying<
            GatherPaintedPartsRequest<PaintingDomain, ProjectDomain>
         >()

      const taskId: PaintTaskId = gatherEnvelope.messageId
      const projectId: ULIDString = projectEnvelope.correlationId

      // Commit the gather envelope payload
      gatherEnvelope.commitBody({
         taskId,
         projectId,
         paintTask: {
            genSeed: task.genSeed,
            plotDataRef: task.plotDataRef,
            domainExtension: task.domainExtension,
         },
         paintGeometry: task.paintGeometry,
         expectedPartCount: chunkCount,
      })

      this.logger.debug(
         `Task ${taskId}: ${pixelWidth}x${pixelHeight} → ${chunkCount} chunks of ~${rowsPerChunk} rows`,
      )

      // Create scatter jobs for each chunk as children of the gather envelope
      const scatterJobs: FlowChildJob[] = Array.from(
         { length: chunkCount },
         (_, chunkIndex) => {
            const firstRow = chunkIndex * rowsPerChunk
            const lastRow = Math.min(
               firstRow + rowsPerChunk - 1,
               pixelHeight - 1,
            )

            const canvasFragment: CanvasFragment = {
               fragmentIndex: chunkIndex,
               totalFragmentsCount: chunkCount,
               fragmentFirstRow: firstRow,
               fragmentLastRow: lastRow,
            }

            // Create chunk envelope as child of gather envelope
            const chunkEnvelope =
               gatherEnvelope.startReplying<PartialPaintRequest>()

            chunkEnvelope.commitBody({
               taskId,
               projectId,
               paintTask: {
                  genSeed: task.genSeed,
                  plotDataRef: task.plotDataRef,
                  domainExtension: task.paintGeometry,
               },
               canvasFragment,
            })

            return {
               name: `chunk:${taskId}:${chunkIndex}`,
               queueName: this.config.scatterPartsQueue,
               data: chunkEnvelope,
            }
         },
      )

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
}
