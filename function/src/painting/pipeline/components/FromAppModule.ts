import type { IFileStore } from "../../../storage/interface/IFileStore.js"
import { createPipeline } from "../../../pipeline/index.js"
import { createEncodingSegment } from "./EncodingSegment.js"
import { createArtworkEngineSegment } from "./ArtworkEngineSegment.js"
import { createWorkerPoolSegment } from "./WorkerPoolSegment.js"
import { PathTargetSelection } from "../values/PathTargetSelection.js"
import { FileStoreSelection } from "../values/FileStoreSelection.js"
import { TaskTermEncoding } from "../values/TaskTermEncoding.js"
import { createFixedEncodingBinding } from "./SetFixedEncodingSegment.js"

const pipelineBuilder = createWorkerPoolSegment(
   createEncodingSegment(createArtworkEngineSegment(createPipeline())),
)

const result = createFixedEncodingBinding(
   "utf-8",
   pipelineBuilder
      .withContextSubject<IFileStore>()
      .addPrivateInjection("fileStore"),
)
   // .withContextSubject<TaskTermEncoding>()
   // .addPrivateFeature("taskTermEncoding", {
   //    encoding: '"utf-8"' as const,
   // })
   .withContextSubject<FileStoreSelection>()
   .addPublicFeature("stagingStrategy", {
      selected: "fileStore" as const,
   })
   .withContextSubject<PathTargetSelection>()
   .addPublicFeature("stagedFilePath", {
      // eslint-disable-next-line no-template-curly-in-string
      selected: "`${appSuffixString}/${appPrefixString}.png`" as const,
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

console.log(artifact({} as any)({} as any))
