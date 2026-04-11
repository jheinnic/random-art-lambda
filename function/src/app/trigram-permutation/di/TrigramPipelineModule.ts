/**
 * TrigramPipelineModule — Assembly Function for the Trigram app pipeline.
 *
 * The static `assemble()` method is the Phase-2 bootstrap entry point.  It is
 * called AFTER a ConfigService has been extracted from a Phase-1 mini-context
 * and AFTER the concrete storage module has been chosen, so that its injection
 * token is available for bridging via useExisting.
 *
 * Owns the full DI wiring:
 *   - imports the caller-supplied storage module
 *   - bridges the caller's token to the module-local WorkerFileStore token
 *   - builds the pipeline inline (preserving full type accumulation)
 *   - exports PipelineFn under TrigramModuleTypes.PipelineFn
 */

import { DynamicModule, Module } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"

import { createPipeline } from "../../../pipeline/index.js"
import { createEncodingSegment } from "../../../painting/pipeline/components/EncodingSegment.js"
import { createPermutationSegment } from "../../../painting/pipeline/components/PermutationSegment.js"
import { createWorkerPoolSegment } from "../../../painting/pipeline/components/WorkerPoolSegment.js"
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
// Module
// ---------------------------------------------------------------------------

@Module({})
export class TrigramPipelineModule {
   /**
    * Assembly Function for the Trigram app pipeline.
    *
    * @param configSvc - Resolved ConfigService from Phase-1 bootstrap.
    * @param fileStore - The module/token pair supplying the IFileStore.
    *                   The module must export `fileStore.token`.
    *                   The token is bridged to the module-local WorkerFileStore
    *                   token via useExisting.
    */
   static assemble(
      configSvc: ConfigService,
      fileStore: { module: DynamicModule; token: symbol },
   ): DynamicModule {
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
      const b0 = createPipeline<TrigramPipelineInput>()
         .addPrivateInjection<IFileStore, "fileStore">("fileStore")

      // 2. Encoding: adds originalEncoding to initial/step context,
      //    declares encodingOverride virtual.
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
         .addPublicFeature("stagedFilePath", {
            // eslint-disable-next-line no-template-curly-in-string
            selected: [`resolvedFileNameExpression ?? '${defaultPath}'`],
         })
         .addPrivateFeature("stagingStrategy", { selected: "fileStore" })
         .buildPipeline({
            status: ["stagingResult", "status"] as const,
            uri: ["stagingResult", "uri"] as const,
         })

      return {
         module: TrigramPipelineModule,
         imports: [fileStore.module],
         providers: [
            // Bridge: caller's token → module-local WorkerFileStore token.
            {
               provide: TrigramModuleTypes.WorkerFileStore,
               useExisting: fileStore.token,
            },
            // Bind the compiled pipeline, injecting the DI-resolved IFileStore.
            {
               provide: TrigramModuleTypes.PipelineFn,
               useFactory:
                  (store: IFileStore) =>
                  (initial: TrigramPipelineInput) =>
                     pipeline(initial, { fileStore: store }),
               inject: [TrigramModuleTypes.WorkerFileStore],
            },
         ],
         exports: [TrigramModuleTypes.PipelineFn],
      }
   }
}
