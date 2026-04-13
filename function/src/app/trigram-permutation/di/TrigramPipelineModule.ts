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
import { createEncodingSegment } from "../../../painting/pipeline/components/EncodingSegment.js"
import { createPermutationSegment } from "../../../painting/pipeline/components/PermutationSegment.js"
import {
   createWorkerPoolSegment,
   type FileStoreSelection,
   type PathTargetSelection,
} from "../../../painting/pipeline/components/WorkerPoolSegment.js"
import type { IFileStore } from "../../../storage/interface/IFileStore.js"
import { TrigramModuleTypes } from "./Types.js"

// ---------------------------------------------------------------------------
// Pipeline initial-context type
// ---------------------------------------------------------------------------

/**
 * Fields that the gathering worker provides when calling the compiled pipeline.
 *
 * `originalEncoding` is absent — added to the initial context by
 * createEncodingSegment() via extendInitial(), with the config-derived default.
 *
 * `prefix` / `suffix` carry the raw bytes of the trigram strings so that
 * createPermutationSegment() can re-encode them to the resolved encoding.
 */
export interface TrigramPipelineInput {
   /** Raw prefix bytes (Uint8ClampedArray wrapping a Buffer's underlying memory). */
   prefix: Uint8ClampedArray
   /** Raw suffix bytes. */
   suffix: Uint8ClampedArray
   /** Rendered canvas image produced by the paint step. */
   canvasBuffer: Buffer
   /**
    * Resolved filename expression forwarded from the paint task.
    * The stagedFilePath feature's expression references this field;
    * falls back to the config default when undefined.
    */
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
         // Each const step receives the fully-accumulated type from the prior
         // step — TypeScript verifies every selector, key uniqueness, and
         // virtual fulfillment without any `as any` escape.
         // ------------------------------------------------------------------

         // 1. Declare the fileStore injection slot (private — hidden from expressions).
         const b0 = createPipeline<TrigramPipelineInput>().addPrivateInjection<
            IFileStore,
            "fileStore"
         >("fileStore")

         // 2. Encoding: adds originalEncoding to initial/step context,
         //    resolvedEncoding public feature, declares encodingOverride virtual.
         const b1 = createEncodingSegment(configSvc)(b0)

         // 3. Permutation: adds transcodedTerms public feature,
         //    declares appTerms virtual.
         const b2 = createPermutationSegment(configSvc)(b1)

         // 4. Worker pool: declares stagingStrategy + stagedFilePath virtuals,
         //    registers stagingResult step.
         const b3 = createWorkerPoolSegment(configSvc)(b2)

         // 5. Fulfill virtuals with application-specific expressions.
         //    stagedFilePath: resolvedFileNameExpression from initial context,
         //      falling back to the config-derived default.
         //    stagingStrategy: selects the injected fileStore by name.
         const pipeline = b3
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
               {
                  selected: "fileStore",
               },
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
