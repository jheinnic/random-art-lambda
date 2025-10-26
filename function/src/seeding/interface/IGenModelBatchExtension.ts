import { KnownExtensionClassIds } from "../../extensions/kinds/ExtensionClassKind.js"
import { GenModelBatchKind } from "../kinds/BatchModelKind.js"
import { GEN_MODEL_BATCH_EXTENSION_POINT } from "../kinds/Constants.js"
import { NestedBatch } from "../models/NestedBatch.js"
import { SeedByExtension } from "../models/SeedByExtension.js"

export interface IGenModelBatchExtension<
   K extends KnownExtensionClassIds<GEN_MODEL_BATCH_EXTENSION_POINT>,
> {
   validate: (
      input: SeedByExtension<
         KnownExtensionClassIds<GEN_MODEL_BATCH_EXTENSION_POINT>
      >,
   ) => input is GenModelBatchKind<K>

   toBatchModel: (
      input: SeedByExtension<
         KnownExtensionClassIds<GEN_MODEL_BATCH_EXTENSION_POINT>
      >,
   ) => NestedBatch
}
