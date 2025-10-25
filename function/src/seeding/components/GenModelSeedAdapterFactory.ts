import {
   GEN_MODEL_SEED_TYPE_EXTENSION_POINT_STRING,
   GEN_MODEL_SEED_ADAPTER_ID_STR,
} from "./../interface/SeedTypeExtensionPoint"
import {
   IExtensionClass,
   KnownExtensionIds,
   PayloadTypeKind,
} from "../../extensions/interface/IExtension.js"
import { IAdapterFactory } from "../../extensions/interface/IAdapterFactory.js"
import { GenModelSeedAdapter } from "./GenModelSeedAdapter.js"
import {
   GEN_MODEL_SEED_ADAPTER_ID,
   GEN_MODEL_SEED_TYPE_EXTENSION_POINT,
} from "../interface/SeedTypeExtensionPoint.js"
import { Injectable } from "@nestjs/common"

@Injectable()
export class GenModelSeedAdapterFactory
   implements
      IAdapterFactory<
         GEN_MODEL_SEED_TYPE_EXTENSION_POINT,
         GEN_MODEL_SEED_ADAPTER_ID
      >
{
   readonly URI: `${GEN_MODEL_SEED_TYPE_EXTENSION_POINT}/${GEN_MODEL_SEED_ADAPTER_ID}` = `${GEN_MODEL_SEED_TYPE_EXTENSION_POINT_STRING}/${GEN_MODEL_SEED_ADAPTER_ID_STR}`

   adapt<
      ExtensionId extends
         KnownExtensionIds<GEN_MODEL_SEED_TYPE_EXTENSION_POINT>,
      ExtensionClass extends IExtensionClass<
         GEN_MODEL_SEED_TYPE_EXTENSION_POINT,
         ExtensionId
      >,
   >(
      key: ExtensionId,
      extensionClass: ExtensionClass,
      extension: PayloadTypeKind<
         GEN_MODEL_SEED_TYPE_EXTENSION_POINT,
         ExtensionId
      >,
   ): GenModelSeedAdapter<ExtensionId> {
      return new GenModelSeedAdapter(key, extensionClass, extension)
   }
}
