import { KnownExtensionIds } from "../../../extensions/kinds/ExtPointKind.js"
import { PaintableSeed } from "./PaintableSeed.js"
import { GEN_MODEL_SEED_EXTENSION_POINT } from "../kinds/Constants.js"
import { SeedByExtension } from "./SeedByExtension.js"
import { Async, SomeAsync } from "./SomeAsync.js"

export interface PaintingTask {
   plotModelSeed: PaintableSeed
   regionMapExpression: string

   /**
    * This should resolve to:
    * -- Array<Array<string>> to specify a list of paths
    * -- Array<string> to specify a single path.
    * -- "stream" to specify an implicit Writable stream
    */
   sendToExpression: string
}

export type AsyncPaintingTask = Async<PaintingTask>

export type AsyncPaintableSeed = Async<PaintableSeed>

export type PaintableSeedLike =
   | PaintableSeed
   | SeedByExtension<KnownExtensionIds<GEN_MODEL_SEED_EXTENSION_POINT>>

export type AsyncPaintableSeedLike = Async<PaintableSeedLike>

export type SomePaintableSeed = SomeAsync<PaintableSeed>

export type SomePaintableSeedLike = SomeAsync<PaintableSeedLike>
