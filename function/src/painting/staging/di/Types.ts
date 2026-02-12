/**
 * Injection tokens for the Staging module.
 *
 * Following DI organization conventions:
 * - Tokens this module EXPORTS (well-known singletons)
 * - Tokens this module RECEIVES from outside (injected dependencies)
 */
export const StagingModuleTypes = {
   // ============================================================================
   // Exported Tokens (singletons this module provides)
   // ============================================================================

   /**
    * The configured image stager implementation (S3, Local, etc.)
    * Consumers inject this to stage rendered images.
    */
   IImageStager: Symbol("StagingModule.IImageStager"),

   // ============================================================================
   // Injected Tokens (dependencies this module receives)
   // ============================================================================

   // Currently none - StagingModule is self-contained
   // If we add dependencies (e.g., a metrics service), they go here:
   // InjectedMetricsService: Symbol("StagingModule.InjectedMetricsService"),
}

/**
 * Re-export for backwards compatibility during migration.
 * @deprecated Use StagingModuleTypes.IImageStager instead
 */
export const IMAGE_STAGER_TOKEN = StagingModuleTypes.IImageStager
