import "reflect-metadata"
import type { Type } from "@nestjs/common"

import type { CapabilityRequirement } from "./WorkerCapabilities.js"
import { TenantIsolationLevel } from "./TenantRouting.js"

// ============================================================================
// Core Interface
// ============================================================================

/**
 * Base interface for Activity Units - modular post-processing components.
 *
 * Each Activity Unit receives a context and produces a report. The exact
 * types are defined by the implementing class and declared in metadata.
 *
 * @typeParam TContext - The input context type this unit requires
 * @typeParam TReport - The report type this unit produces
 */
export interface IActivityUnit<TContext = unknown, TReport = unknown> {
   /**
    * Execute the activity unit's logic.
    *
    * @param context - The accumulated context from prior units
    * @returns A report describing the outcome
    */
   execute(context: TContext): Promise<TReport>
}

// ============================================================================
// Metadata Types
// ============================================================================

/**
 * Where an Activity Unit is allowed to execute.
 *
 * This informs the FlowProducer how to route gathering work:
 * - ORIGIN_ONLY: Must run on the node that originated the task (e.g., needs local GPU)
 * - WORKER_OK: Can run on any worker node
 * - EITHER: Flexible, can be routed to balance load
 */
export enum ExecutionLocation {
   /** Must execute on the origin node (has local dependencies) */
   ORIGIN_ONLY = "origin",
   /** Can execute on any worker node */
   WORKER_OK = "worker",
   /** Flexible - system decides based on load */
   EITHER = "either",
}

/**
 * Who provides configuration values for an Activity Unit.
 *
 * - DEVELOPER: Baked in at build time (e.g., which units to compose)
 * - OPERATOR: Runtime deployment config (e.g., bucket names, connection strings)
 * - BOTH: Some values from each source
 */
export enum ConfigSource {
   /** Configuration is determined by app developer at build time */
   DEVELOPER = "developer",
   /** Configuration is provided by operator at deployment/runtime */
   OPERATOR = "operator",
   /** Configuration comes from both sources */
   BOTH = "both",
}

/**
 * Metadata for an Activity Unit, provided via the @ActivityUnit decorator.
 */
export interface ActivityUnitMetadata {
   /**
    * Unique name for this activity unit.
    * Used for logging, metrics, and configuration namespacing.
    */
   readonly name: string

   /**
    * Where this unit is allowed to execute.
    * Informs FlowProducer routing decisions.
    */
   readonly executionLocation: ExecutionLocation

   /**
    * Priority for ordering when multiple units in a pipeline.
    * Lower numbers execute first.
    * @default 100
    */
   readonly priority?: number

   /**
    * NestJS injection token for this unit's configuration service.
    * The config service provides runtime parameters.
    */
   readonly configServiceKey?: symbol

   /**
    * Who provides the configuration values.
    * Helps validate that operator config is present at startup.
    */
   readonly configSource?: ConfigSource

   /**
    * Label used in per-task logging/reporting.
    * Typically a human-readable short name.
    */
   readonly reportLabel?: string

   /**
    * Context fields this unit requires to execute.
    * Used for dependency validation.
    */
   readonly requires?: string[]

   /**
    * Context fields this unit provides after execution.
    * These get merged into the accumulated context.
    */
   readonly provides?: string[]

   /**
    * Worker capabilities this unit requires.
    *
    * Used by FlowProducer to route work to capable workers.
    * Activities without capability requirements can run on any worker.
    *
    * @example
    * ```typescript
    * @ActivityUnit({
    *    name: "S3Staging",
    *    capabilities: [
    *       requires.required(Capabilities.FILE_STORE, "s3-primary"),
    *    ],
    * })
    * ```
    */
   readonly capabilities?: CapabilityRequirement[]

   /**
    * Tenant isolation requirement for multi-tenant deployments.
    *
    * - REQUIRED: Must run on tenant-specific worker (handles tenant credentials)
    * - PREFERRED: Prefers tenant worker but can use shared if unavailable
    * - NONE: Can safely run on shared workers (tenant-agnostic)
    *
    * @default TenantIsolationLevel.NONE
    */
   readonly tenantIsolation?: TenantIsolationLevel
}

// ============================================================================
// Metadata Keys
// ============================================================================

const ACTIVITY_UNIT_METADATA_KEY = Symbol("activityUnit:metadata")

// ============================================================================
// Registry
// ============================================================================

/**
 * Central registry for all @ActivityUnit-decorated classes.
 *
 * Since TypeScript decorators don't provide a discovery mechanism,
 * we maintain this registry to track all registered units.
 */
export class ActivityUnitRegistry {
   private static readonly units = new Map<
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Type<IActivityUnit<any, any>>,
      ActivityUnitMetadata
   >()

   /**
    * Register an Activity Unit class with its metadata.
    * Called by the @ActivityUnit decorator.
    */
   static register(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      target: Type<IActivityUnit<any, any>>,
      metadata: ActivityUnitMetadata,
   ): void {
      this.units.set(target, metadata)
   }

   /**
    * Get all registered Activity Units.
    */
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   static getAllUnits(): Array<[Type<IActivityUnit<any, any>>, ActivityUnitMetadata]> {
      return Array.from(this.units.entries())
   }

   /**
    * Get Activity Units ordered by priority (lower first).
    */
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   static getOrderedUnits(): Type<IActivityUnit<any, any>>[] {
      return Array.from(this.units.entries())
         .sort(([, a], [, b]) => (a.priority ?? 100) - (b.priority ?? 100))
         .map(([cls]) => cls)
   }

   /**
    * Get units filtered by execution location.
    */
   static getUnitsByLocation(
      location: ExecutionLocation,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
   ): Type<IActivityUnit<any, any>>[] {
      return Array.from(this.units.entries())
         .filter(([, meta]) => meta.executionLocation === location)
         .map(([cls]) => cls)
   }

   /**
    * Check if any registered units require origin-only execution.
    * Used by FlowProducer to determine routing strategy.
    */
   static hasOriginOnlyUnits(): boolean {
      return Array.from(this.units.values()).some(
         (meta) => meta.executionLocation === ExecutionLocation.ORIGIN_ONLY,
      )
   }

   /**
    * Get metadata for a specific unit class.
    */
   static getMetadata(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      target: Type<IActivityUnit<any, any>>,
   ): ActivityUnitMetadata | undefined {
      return this.units.get(target)
   }

   /**
    * Clear the registry (mainly for testing).
    */
   static clear(): void {
      this.units.clear()
   }
}

// ============================================================================
// Decorator
// ============================================================================

/**
 * Decorator to mark a class as an Activity Unit.
 *
 * Activity Units are modular post-processing components that can be
 * composed into pipelines. Each unit declares:
 * - What it needs (requires)
 * - What it produces (provides)
 * - Where it can run (executionLocation)
 * - How it's configured (configSource, configServiceKey)
 *
 * @example
 * ```typescript
 * @Injectable()
 * @ActivityUnit({
 *    name: "S3ImageStager",
 *    executionLocation: ExecutionLocation.WORKER_OK,
 *    priority: 100,
 *    configServiceKey: S3_STAGER_CONFIG,
 *    configSource: ConfigSource.OPERATOR,
 *    reportLabel: "S3 Upload",
 *    requires: ["imageData", "genSeed"],
 *    provides: ["s3Location"],
 * })
 * export class S3ImageStager implements IActivityUnit<StagingContext, S3StagingReport> {
 *    async execute(context: StagingContext): Promise<S3StagingReport> {
 *       // ... staging logic
 *    }
 * }
 * ```
 */
export function ActivityUnit(metadata: ActivityUnitMetadata): ClassDecorator {
   return (target) => {
      // Store metadata on the class
      Reflect.defineMetadata(ACTIVITY_UNIT_METADATA_KEY, metadata, target)

      // Register with the global registry
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ActivityUnitRegistry.register(target as unknown as Type<IActivityUnit<any, any>>, metadata)
   }
}

/**
 * Retrieve ActivityUnit metadata from a decorated class.
 */
export function getActivityUnitMetadata(
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   target: Type<IActivityUnit<any, any>>,
): ActivityUnitMetadata | undefined {
   return Reflect.getMetadata(ACTIVITY_UNIT_METADATA_KEY, target)
}
