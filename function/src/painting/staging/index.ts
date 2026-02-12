// DI - Module, Types, Configuration
export { StagingModule } from "./di/Module.js"
export { StagingModuleTypes, IMAGE_STAGER_TOKEN } from "./di/Types.js"
export type {
   StagingModuleOptions,
   S3StagerConfig,
   LocalStagerConfig,
} from "./di/Configuration.js"

// Interface
export { type IImageStager, type StagingContext } from "./interface/IImageStager.js"

// Implementations
export { S3ImageStager } from "./components/S3ImageStager.js"
export { LocalImageStager } from "./components/LocalImageStager.js"
