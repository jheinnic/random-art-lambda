import { KnownGenModelSeedExtensionIds } from "../kinds/GenModelSeedKind.js"
import { BatchType } from "./BatchType.js"
import { PaintableSeed } from "./PaintableSeed.js"
import { SeedByExtension } from "./SeedByExtension.js"

export interface PaintableBatch extends BatchType<"PaintableBatch"> {
   readonly batchKey: "PaintableBatch"
   readonly children: readonly NestedElement[]
}

export interface NestedBatch {
   readonly batchKey: "NestedBatch"
   regionMaps?: string | string[]

   /**
    * This should resolve to:
    * -- Array<Array<string>> to specify a list of paths
    * -- Array<string> to specify a single path.
    */
   sendTo?: string

   children: NestedElement[]
}

export type NestedElement =
   | NestedBatch
   | PaintableSeed
   | SeedByExtension<KnownGenModelSeedExtensionIds>
