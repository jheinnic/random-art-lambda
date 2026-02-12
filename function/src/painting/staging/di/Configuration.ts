/**
 * Configuration interfaces for the Staging module.
 *
 * These are re-exported from the component files for convenience,
 * following the DI organization pattern where Configuration.ts
 * aggregates all config types.
 */

// Re-export component-specific configs
export type { S3StagerConfig } from "../components/S3ImageStager.js"
export type { LocalStagerConfig } from "../components/LocalImageStager.js"

/**
 * Configuration options for the StagingModule.forRoot() method.
 *
 * Determines which stager implementation to use and provides
 * the necessary configuration for that implementation.
 */
export interface StagingModuleOptions {
   /**
    * Which stager implementation to use
    */
   stagerType: "s3" | "local"

   /**
    * S3 configuration (required if stagerType is "s3")
    */
   s3Config?: import("../components/S3ImageStager.js").S3StagerConfig

   /**
    * Local configuration (required if stagerType is "local")
    */
   localConfig?: import("../components/LocalImageStager.js").LocalStagerConfig
}
