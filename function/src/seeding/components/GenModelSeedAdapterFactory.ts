import {
   KnownExtensionClassIds,
   PayloadTypeKind,
} from "../../extensions/kinds/ExtensionClassKind.js"
import { IAdapterFactory } from "../../extensions/interface/IAdapterFactory.js"
import { GenModelSeedAdapter } from "./GenModelSeedAdapter.js"
import {
   GEN_MODEL_SEED_EXTENSION_POINT_STRING,
   GEN_MODEL_SEED_ADAPTER_ID_STR,
   GEN_MODEL_SEED_ADAPTER_ID,
   GEN_MODEL_SEED_EXTENSION_POINT,
} from "../kinds/Constants.js"
import { Injectable } from "@nestjs/common"

@Injectable()
export class GenModelSeedAdapterFactory
   implements
      IAdapterFactory<GEN_MODEL_SEED_EXTENSION_POINT, GEN_MODEL_SEED_ADAPTER_ID>
{
   readonly extensionPoint: GEN_MODEL_SEED_EXTENSION_POINT =
      GEN_MODEL_SEED_EXTENSION_POINT_STRING

   readonly adapterId: GEN_MODEL_SEED_ADAPTER_ID = GEN_MODEL_SEED_ADAPTER_ID_STR

   adapt(
      extensionId: KnownExtensionClassIds<GEN_MODEL_SEED_EXTENSION_POINT>,
      extension: PayloadTypeKind<
         GEN_MODEL_SEED_EXTENSION_POINT,
         typeof extensionId
      >,
   ): GenModelSeedAdapter<typeof extensionId> {
      return new GenModelSeedAdapter<typeof extensionId>(extensionId, extension)
   }
}
