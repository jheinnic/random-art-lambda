/**
 * PipelineModule — final DI orchestrator for the storage pipeline.
 *
 * Receives the PipelineFactory closure (built during Phase-2 bootstrap by the
 * Assembly Function) and the bridged file-store module.  It calls the factory
 * once to get the compiled pipeline, then wraps it to bind the DI-resolved
 * IFileStore into the injections argument, exporting the result as PIPELINE_FN.
 *
 * Usage (inside the Assembly Function):
 *
 *   const fileStoreMod = FileStorePipelineModule.forRoot(storageModule)
 *   return PipelineModule.forRoot(pipelineFactory, fileStoreMod)
 */

import { DynamicModule, Module } from "@nestjs/common"
import type { IFileStore } from "../../interface/IFileStore.js"
import { WORKER_FILE_STORE } from "../../tokens.js"
import { PIPELINE_FACTORY, PIPELINE_FN, type PipelineFactory } from "./Types.js"

/* eslint-disable @typescript-eslint/no-explicit-any */

@Module({})
export class PipelineModule {
   /**
    * @param pipelineFactory - Closure produced by the Assembly Function.
    * @param fileStoreMod    - Result of FileStorePipelineModule.forRoot(); exports WORKER_FILE_STORE.
    */
   static forRoot(
      pipelineFactory: PipelineFactory,
      fileStoreMod: DynamicModule,
   ): DynamicModule {
      return {
         module: PipelineModule,
         imports: [fileStoreMod],
         providers: [
            {
               provide: PIPELINE_FACTORY,
               useValue: pipelineFactory,
            },
            {
               provide: PIPELINE_FN,
               useFactory: (
                  fileStore: IFileStore,
                  factory: PipelineFactory,
               ) => {
                  // Build the compiled pipeline (declares injection slots).
                  const pipeline = factory()
                  // Wrap it so callers only supply the initial context;
                  // DI-resolved injection values are bound here.
                  return (initial: any) => pipeline(initial, { fileStore })
               },
               inject: [WORKER_FILE_STORE, PIPELINE_FACTORY],
            },
         ],
         exports: [PIPELINE_FN],
      }
   }
}
