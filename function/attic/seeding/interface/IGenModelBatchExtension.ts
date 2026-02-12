import { KnownExtensionIds } from "../../../extensions/kinds/ExtPointKind.js"
import { GenModelBatchKind } from "../kinds/BatchModelKind.js"
import { GEN_MODEL_BATCH_EXTENSION_POINT } from "../kinds/Constants.js"
import { NestedBatch } from "../models/PaintableBatch.js"
import { SeedByExtension } from "../models/SeedByExtension.js"

export interface IGenModelBatchExtension<
   K extends KnownExtensionIds<GEN_MODEL_BATCH_EXTENSION_POINT>,
> {
   validate: (
      input: SeedByExtension<
         KnownExtensionIds<GEN_MODEL_BATCH_EXTENSION_POINT>
      >,
   ) => input is GenModelBatchKind<K>

   toBatchModel: (
      input: SeedByExtension<
         KnownExtensionIds<GEN_MODEL_BATCH_EXTENSION_POINT>
      >,
   ) => NestedBatch
}
