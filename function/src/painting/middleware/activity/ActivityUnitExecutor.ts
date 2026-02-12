import { Injectable, Logger, Type } from "@nestjs/common"
import { ModuleRef } from "@nestjs/core"

import {
   type IActivityUnit,
   type ActivityUnitMetadata,
   ActivityUnitRegistry,
   getActivityUnitMetadata,
   ExecutionLocation,
} from "./ActivityUnitAnnotations.js"

/**
 * Result of executing an activity unit.
 */
export interface ActivityExecutionResult<TReport = unknown> {
   /** The unit that was executed */
   readonly unitName: string
   /** Whether execution succeeded */
   readonly success: boolean
   /** The report if successful */
   readonly report?: TReport
   /** Error message if failed */
   readonly error?: string
   /** Execution duration in milliseconds */
   readonly durationMs: number
}

/**
 * Aggregated result from executing a pipeline of activity units.
 */
export interface PipelineExecutionResult {
   /** Overall success - true only if all units succeeded */
   readonly success: boolean
   /** Results from each unit in execution order */
   readonly unitResults: ActivityExecutionResult[]
   /** Total execution duration in milliseconds */
   readonly totalDurationMs: number
   /** Final accumulated context */
   readonly finalContext: Record<string, unknown>
}

/**
 * Configuration for pipeline execution.
 */
export interface PipelineExecutionConfig {
   /** Log each unit execution */
   readonly verbose?: boolean
   /** Stop on first error vs continue and collect all */
   readonly failFast?: boolean
   /** Filter to only run units matching this execution location */
   readonly locationFilter?: ExecutionLocation
}

/**
 * Executes Activity Unit pipelines.
 *
 * Similar to AnnotatedChainExecutor but for Activity Units specifically.
 * Handles:
 * - Discovering registered units from ActivityUnitRegistry
 * - Ordering by priority
 * - Filtering by execution location (for split routing)
 * - Executing units via NestJS DI
 * - Accumulating context between units
 * - Collecting execution results and timing
 */
@Injectable()
export class ActivityUnitExecutor {
   private readonly logger = new Logger("ActivityUnitExecutor")

   constructor(private readonly moduleRef: ModuleRef) {}

   /**
    * Execute a pipeline of activity units.
    *
    * @param initialContext - Starting context (from prior processing)
    * @param unitClasses - Optional specific units to run (defaults to all registered)
    * @param config - Execution configuration
    */
   async executePipeline<TContext extends object>(
      initialContext: TContext,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      unitClasses?: Type<IActivityUnit<any, any>>[],
      config: PipelineExecutionConfig = {},
   ): Promise<PipelineExecutionResult> {
      const { verbose = false, failFast = true, locationFilter } = config
      const startTime = Date.now()

      // Get units to execute
      let units = unitClasses ?? ActivityUnitRegistry.getOrderedUnits()

      // Apply location filter if specified
      if (locationFilter) {
         units = units.filter((cls) => {
            const meta = getActivityUnitMetadata(cls)
            return (
               meta &&
               (meta.executionLocation === locationFilter ||
                  meta.executionLocation === ExecutionLocation.EITHER)
            )
         })
      }

      // Accumulate context and results
      let context: Record<string, unknown> = { ...initialContext } as Record<string, unknown>
      const unitResults: ActivityExecutionResult[] = []
      let overallSuccess = true

      for (const UnitClass of units) {
         const metadata = getActivityUnitMetadata(UnitClass)
         if (!metadata) {
            this.logger.warn(`Unit ${UnitClass.name} has no metadata, skipping`)
            continue
         }

         const unitStartTime = Date.now()

         if (verbose) {
            this.logger.log(
               `Executing activity unit: ${metadata.name} (priority: ${metadata.priority ?? 100})`,
            )
         }

         try {
            // Resolve the unit instance via NestJS DI
            const unitInstance = await this.moduleRef.resolve(
               // eslint-disable-next-line @typescript-eslint/no-explicit-any
               UnitClass as Type<IActivityUnit<any, any>>,
               undefined,
               { strict: false },
            )

            // Execute the unit
            const report = await unitInstance.execute(context)

            // Merge any provided fields into context
            if (metadata.provides && report && typeof report === "object") {
               for (const field of metadata.provides) {
                  if (field in (report as object)) {
                     context[field] = (report as Record<string, unknown>)[field]
                  }
               }
            }

            const durationMs = Date.now() - unitStartTime

            unitResults.push({
               unitName: metadata.name,
               success: true,
               report,
               durationMs,
            })

            if (verbose) {
               this.logger.log(
                  `Unit ${metadata.name} completed in ${durationMs}ms`,
               )
            }
         } catch (error) {
            const durationMs = Date.now() - unitStartTime
            const errorMessage =
               error instanceof Error ? error.message : "Unknown error"

            this.logger.error(`Unit ${metadata.name} failed: ${errorMessage}`)

            unitResults.push({
               unitName: metadata.name,
               success: false,
               error: errorMessage,
               durationMs,
            })

            overallSuccess = false

            if (failFast) {
               break
            }
         }
      }

      return {
         success: overallSuccess,
         unitResults,
         totalDurationMs: Date.now() - startTime,
         finalContext: context,
      }
   }

   /**
    * Execute only units that can run on workers (not origin-only).
    * Convenience method for the common case.
    */
   async executeWorkerUnits<TContext extends object>(
      initialContext: TContext,
      config: Omit<PipelineExecutionConfig, "locationFilter"> = {},
   ): Promise<PipelineExecutionResult> {
      return this.executePipeline(initialContext, undefined, {
         ...config,
         locationFilter: ExecutionLocation.WORKER_OK,
      })
   }

   /**
    * Execute only origin-only units.
    * Used when work must happen on the originating node.
    */
   async executeOriginUnits<TContext extends object>(
      initialContext: TContext,
      config: Omit<PipelineExecutionConfig, "locationFilter"> = {},
   ): Promise<PipelineExecutionResult> {
      return this.executePipeline(initialContext, undefined, {
         ...config,
         locationFilter: ExecutionLocation.ORIGIN_ONLY,
      })
   }

   /**
    * Validate that a pipeline can execute given an initial context.
    * Checks that all required fields are either in initial context
    * or provided by earlier units.
    */
   validatePipeline(
      initialProvides: string[],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      unitClasses?: Type<IActivityUnit<any, any>>[],
   ): { valid: boolean; errors: string[] } {
      const errors: string[] = []
      const provided = new Set(initialProvides)

      const units = unitClasses ?? ActivityUnitRegistry.getOrderedUnits()

      for (const UnitClass of units) {
         const metadata = getActivityUnitMetadata(UnitClass)
         if (!metadata) {
            errors.push(`Unit ${UnitClass.name} has no metadata`)
            continue
         }

         // Check requirements
         for (const req of metadata.requires ?? []) {
            if (!provided.has(req)) {
               errors.push(
                  `Unit ${metadata.name} requires "${req}" but it's not provided`,
               )
            }
         }

         // Add provides
         for (const p of metadata.provides ?? []) {
            provided.add(p)
         }
      }

      return {
         valid: errors.length === 0,
         errors,
      }
   }

   /**
    * Analyze units to determine if split routing is needed.
    * Returns routing recommendation for FlowProducer.
    */
   analyzeRoutingRequirements(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      unitClasses?: Type<IActivityUnit<any, any>>[],
   ): RoutingAnalysis {
      const units = unitClasses ?? ActivityUnitRegistry.getOrderedUnits()

      let hasOriginOnly = false
      let hasWorkerOk = false
      const originUnits: string[] = []
      const workerUnits: string[] = []

      for (const UnitClass of units) {
         const metadata = getActivityUnitMetadata(UnitClass)
         if (!metadata) continue

         switch (metadata.executionLocation) {
            case ExecutionLocation.ORIGIN_ONLY:
               hasOriginOnly = true
               originUnits.push(metadata.name)
               break
            case ExecutionLocation.WORKER_OK:
               hasWorkerOk = true
               workerUnits.push(metadata.name)
               break
            case ExecutionLocation.EITHER:
               // Can be routed either way
               workerUnits.push(metadata.name)
               break
         }
      }

      let recommendation: RoutingRecommendation
      if (hasOriginOnly && hasWorkerOk) {
         recommendation = RoutingRecommendation.SPLIT
      } else if (hasOriginOnly) {
         recommendation = RoutingRecommendation.ORIGIN_QUEUE
      } else {
         recommendation = RoutingRecommendation.WORKER_QUEUE
      }

      return {
         recommendation,
         hasOriginOnlyUnits: hasOriginOnly,
         hasWorkerUnits: hasWorkerOk,
         originUnits,
         workerUnits,
      }
   }
}

/**
 * Routing recommendation from analyzing activity units.
 */
export enum RoutingRecommendation {
   /** All work can go through worker queue */
   WORKER_QUEUE = "worker",
   /** All work must go through origin queue */
   ORIGIN_QUEUE = "origin",
   /** Work needs to be split between both queues */
   SPLIT = "split",
}

/**
 * Analysis of routing requirements.
 */
export interface RoutingAnalysis {
   readonly recommendation: RoutingRecommendation
   readonly hasOriginOnlyUnits: boolean
   readonly hasWorkerUnits: boolean
   readonly originUnits: string[]
   readonly workerUnits: string[]
}
