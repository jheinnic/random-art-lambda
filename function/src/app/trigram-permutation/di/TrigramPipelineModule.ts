/**
 * TrigramPipelineModule — assembled via InjectableModuleClassFactory.
 *
 * InternalConfig carries the ConfigService needed by the segment factories.
 * The `fileStore` import token wires the app-context AppFileStore token to
 * the module-internal WorkerFileStore token via importDependencies, which
 * produces a useExisting bridge and imports the storage module automatically.
 *
 * Callers use forRoot():
 *   TrigramPipelineModule.forRoot({
 *     configSvc,
 *     fileStore: {
 *       use: "token", for: "value",
 *       token: TrigramModuleTypes.AppFileStore,
 *       module: storageModule,
 *     },
 *   })
 */

import { ConfigService } from "@nestjs/config"

import {
   InjectableModuleClassFactory,
   type IDynamicModuleBuilder,
} from "../../../modules/index.js"
import { createPipeline } from "../../../pipeline/index.js"
import { createArtworkEngineSegment } from "../../../painting/pipeline/components/ArtworkEngineSegment.js"
import { createEncodingSegment } from "../../../painting/pipeline/components/EncodingSegment.js"
import {
   createWorkerPoolSegment,
   type FileStoreSelection,
   type PathTargetSelection,
} from "../../../painting/pipeline/components/WorkerPoolSegment.js"
import type { PaintedTask } from "../../../painting/pipeline/values/PaintedTask.js"
import type { TaskTermEncoding } from "../../../painting/pipeline/values/TaskTermEncoding.js"
import type { IFileStore } from "../../../storage/interface/IFileStore.js"
import { TrigramModuleTypes } from "./Types.js"

// ---------------------------------------------------------------------------
// Pipeline initial-context type
// ---------------------------------------------------------------------------

/**
 * Fields that the gathering worker provides when calling the compiled pipeline.
 *
 * All PaintedTask fields are required (provided by ArtworkEngineSegment's
 * extendInitial). resolvedFileNameExpression is trigram-specific and optional —
 * the stagedFilePath expression falls back to the config default when absent.
 */
export interface TrigramPipelineInput extends PaintedTask {
   resolvedFileNameExpression?: string
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * InternalConfig: data the module needs to build the pipeline.
 * Must not share keys with the importTokens below.
 */
interface TrigramPipelineInternalConfig {
   configSvc: ConfigService
}

/**
 * Import token map: external key → module-internal token.
 * importDependencies() bridges AppFileStore → WorkerFileStore via useExisting
 * and imports the caller-supplied storage module automatically.
 */
const _importTokens = {
   fileStore: TrigramModuleTypes.WorkerFileStore,
} as const

export const TrigramPipelineModule = InjectableModuleClassFactory.create(
   _importTokens,
   (config: TrigramPipelineInternalConfig) =>
      (builder: IDynamicModuleBuilder) => {
         const { configSvc } = config
         const defaultPath =
            configSvc.get<string>("trigram.defaultFilePathExpression") ??
            "images/unknown.png"

         // ------------------------------------------------------------------
         // Build the compiled pipeline inline.
         //
         // Segments are stateless module-level constants — no configSvc arg.
         // Config-derived values are baked into expression strings here.
         // Each const step receives the fully-accumulated type from the prior
         // step — TypeScript verifies every selector, key uniqueness, and
         // virtual fulfillment without any `as any` escape.
         // ------------------------------------------------------------------

         const appEncoding =
            configSvc.get<BufferEncoding>("trigram.encoding") ?? "utf-8"

         // 1. Base: artwork engine (adds PaintedTask to IC), then add the
         //    trigram-specific optional field with a default of undefined.
         const b0 = createArtworkEngineSegment(createPipeline()).extendInitial<
            { resolvedFileNameExpression?: string },
            "resolvedFileNameExpression"
         >({ resolvedFileNameExpression: undefined })

         // 2. Encoding: declares taskTermEncoding virtual, adds encodedTerms.
         const b1 = createEncodingSegment(b0)

         // 3. Worker pool: declares stagingStrategy + stagedFilePath virtuals,
         //    registers stagingResult step.
         const b2 = createWorkerPoolSegment(b1)

         // 4. Fulfill injections and virtuals with application-specific values.
         const pipeline = b2
            .addPrivateInjection<IFileStore, "fileStore">("fileStore")
            .addPrivateFeature<TaskTermEncoding, "taskTermEncoding">(
               "taskTermEncoding",
               { encoding: `"${appEncoding}"` },
            )
            .addPublicFeature<PathTargetSelection, "stagedFilePath">(
               "stagedFilePath",
               {
                  // eslint-disable-next-line no-template-curly-in-string
                  selected: [
                     `resolvedFileNameExpression ?? '${defaultPath}'`,
                  ] as const,
               },
            )
            .addPrivateFeature<FileStoreSelection, "stagingStrategy">(
               "stagingStrategy",
               { selected: "fileStore" },
            )
            .buildPipeline({
               status: ["stagingResult", "status"] as const,
               uri: ["stagingResult", "uri"] as const,
            })

         // Bind the compiled pipeline, injecting the DI-resolved IFileStore
         // via the module-internal WorkerFileStore token (bridged from AppFileStore
         // by importDependencies above).
         builder.exportProviders({
            provide: TrigramModuleTypes.PipelineFn,
            useFactory:
               (store: IFileStore) => (initial: TrigramPipelineInput) =>
                  pipeline(initial, { fileStore: store }),
            inject: [TrigramModuleTypes.WorkerFileStore],
         })
      },
).build()
