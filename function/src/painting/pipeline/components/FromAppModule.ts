import type { IFileStore } from "../../../storage/interface/IFileStore.js"
import { createPipeline } from "../../../pipeline/index.js"
import { createEncodingSegment } from "./EncodingSegment.js"
import { createArtworkEngineSegment } from "./ArtworkEngineSegment.js"
import {
   createWorkerPoolSegment,
   FileStoreSelection,
   PathTargetSelection,
} from "./WorkerPoolSegment.js"
import { TaskTermEncoding } from "../values/TaskTermEncoding.js"

const pipelineBuilder = createWorkerPoolSegment(
   createEncodingSegment(createArtworkEngineSegment(createPipeline())),
)

const result = pipelineBuilder
   .addPrivateInjection<IFileStore, "fileStore">("fileStore")
   .addPrivateFeature<TaskTermEncoding, "taskTermEncoding">(
      "taskTermEncoding",
      { encoding: ['"utf-8"'] },
   )
   .addPublicFeature<FileStoreSelection, "stagingStrategy">("stagingStrategy", {
      selected: "fileStore",
   })
   .addPublicFeature<PathTargetSelection, "stagedFilePath">("stagedFilePath", {
      // eslint-disable-next-line no-template-curly-in-string
      selected: ["`${appSuffixString}/${appPrefixString}.png`"],
   })

/**
 * This is the artifact that gets injected into the Gathering Worker, not the work implemented in
 * src/staging
 */
const artifact = result.buildPipeline<{ a: string; b: string; c: string }>({
   a: ["encodedTerms", "appPrefixString"],
   b: ["stagingStrategy", "selected"],
   c: ["stagedFilePath", "selected"],
})

console.log(artifact({} as any, {} as any))
