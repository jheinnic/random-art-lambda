/**
 * FileStorePipelineModule — bridges a concrete storage module to the pipeline.
 *
 * The caller supplies any DynamicModule that exports WORKER_FILE_STORE (e.g. a
 * storage module configured with `exportToken: WORKER_FILE_STORE`).
 * This module imports it and re-exports WORKER_FILE_STORE so that PipelineModule
 * can inject the store without knowing which concrete implementation is in use.
 */

import { DynamicModule, Module } from "@nestjs/common"
import { WORKER_FILE_STORE } from "../../tokens.js"

@Module({})
export class FileStorePipelineModule {
   /**
    * @param storageModule - Any DynamicModule that exports WORKER_FILE_STORE.
    */
   static forRoot(storageModule: DynamicModule): DynamicModule {
      return {
         module: FileStorePipelineModule,
         imports: [storageModule],
         exports: [WORKER_FILE_STORE],
      }
   }
}
