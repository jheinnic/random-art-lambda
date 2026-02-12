import { DynamicModule, Module, Provider } from "@nestjs/common"

import { StagingModuleTypes } from "./Types.js"
import type { StagingModuleOptions } from "./Configuration.js"
import type { IImageStager } from "../interface/IImageStager.js"
import { S3ImageStager } from "../components/S3ImageStager.js"
import { LocalImageStager } from "../components/LocalImageStager.js"

/**
 * Module for image staging functionality.
 *
 * Use StagingModule.forRoot() to configure which implementation
 * to use at application startup.
 *
 * Exports:
 *   - StagingModuleTypes.IImageStager: The configured stager implementation
 *
 * @example
 * // In your app module:
 * StagingModule.forRoot({
 *   stagerType: process.env.STAGER_TYPE as "s3" | "local",
 *   s3Config: {
 *     bucketName: process.env.S3_BUCKET,
 *     region: process.env.AWS_REGION,
 *     keyPrefix: "rendered-art",
 *   },
 *   localConfig: {
 *     rootPath: "/tmp/random-art-output",
 *   },
 * })
 *
 * // Inject the stager:
 * @Inject(StagingModuleTypes.IImageStager)
 * private readonly stager: IImageStager
 */
@Module({})
export class StagingModule {
   static forRoot(options: StagingModuleOptions): DynamicModule {
      const stagerProvider = this.createStagerProvider(options)

      return {
         module: StagingModule,
         providers: [stagerProvider],
         exports: [StagingModuleTypes.IImageStager],
         global: true, // Make available throughout the app
      }
   }

   private static createStagerProvider(
      options: StagingModuleOptions,
   ): Provider<IImageStager> {
      return {
         provide: StagingModuleTypes.IImageStager,
         useFactory: (): IImageStager => {
            if (options.stagerType === "s3") {
               if (!options.s3Config) {
                  throw new Error(
                     "S3 stager requires s3Config in StagingModuleOptions",
                  )
               }
               return new S3ImageStager(options.s3Config)
            }

            if (options.stagerType === "local") {
               if (!options.localConfig) {
                  throw new Error(
                     "Local stager requires localConfig in StagingModuleOptions",
                  )
               }
               return new LocalImageStager(options.localConfig)
            }

            throw new Error(`Unknown stager type: ${options.stagerType}`)
         },
      }
   }
}
