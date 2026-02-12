// Activity Unit infrastructure
export {
   // Core interface
   type IActivityUnit,

   // Metadata types
   type ActivityUnitMetadata,
   ExecutionLocation,
   ConfigSource,

   // Decorator and helpers
   ActivityUnit,
   getActivityUnitMetadata,

   // Registry
   ActivityUnitRegistry,
} from "./ActivityUnitAnnotations.js"

// NestJS Module
export {
   ActivityModule,
   type ActivityModuleOptions,
} from "./ActivityModule.js"

// Executor
export {
   ActivityUnitExecutor,
   type ActivityExecutionResult,
   type PipelineExecutionResult,
   type PipelineExecutionConfig,
   type RoutingAnalysis,
   RoutingRecommendation,
} from "./ActivityUnitExecutor.js"

// Response Types
export {
   // Per-activity types
   type ActivityUnitReport,
   type ActivityMetrics,
   type ActivityResult,

   // Pipeline aggregation
   type GatheringPipelineResult,
   GatheringStatus,

   // Envelope response payload
   type GatheringResponse,
   type ActivitySummary,
   type GatheringTiming,
   type GatheringOutputs,

   // Error handling
   type GatheringErrorResponse,
   GatheringErrorCode,
   GatheringStage,
} from "./ActivityResponseTypes.js"

// GatheringWorker Bridge
export {
   GatheringWorkerBridge,
   type AssembledImageHandoff,
   type GatheringBridgeConfig,
} from "./GatheringWorkerBridge.js"

// Worker Capabilities & Routing
export {
   // Capability tokens
   Capabilities,
   type CapabilityToken,

   // Requirement builders
   CapabilityNeed,
   type CapabilityRequirement,
   requires,

   // Worker advertisement
   type ProvidedCapability,
   type WorkerCapabilitySet,

   // Routing
   type RoutingConfiguration,
   type RoutingDecision,
   findCapableWorkers,
   scoreWorker,
   selectWorker,

   // Runtime checker
   CapabilityChecker,
} from "./WorkerCapabilities.js"

// Tenant-Scoped Routing
export {
   // Tenant identity
   type TenantId,
   asTenantId,

   // Redis isolation
   RedisIsolationStrategy,
   type TenantRedisConfig,

   // Tenant worker configuration
   type TenantWorkerConfig,
   type TenantRoutingConfiguration,
   MissingTenantBehavior,

   // Task tenant context
   type TaskTenantContext,

   // Routing
   type TenantRoutingDecision,
   selectTenantWorker,
   getTenantQueueName,
   parseTenantQueueName,

   // Activity tenant requirements
   TenantIsolationLevel,
   requiresTenantIsolation,
} from "./TenantRouting.js"

// Example Activities
export {
   // File staging
   ImageFileStagingActivity,
   type ImageStagingContext,
   type ImageStagingReport,

   // HTTP upload
   HttpImageUploadActivity,
   type HttpUploadContext,
   type HttpUploadReport,

   // Multi-destination
   MultiDestinationStagingActivity,
   type MultiDestinationContext,
   type MultiDestinationReport,
} from "./ImageFileStagingActivity.js"
