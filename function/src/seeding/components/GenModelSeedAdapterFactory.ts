// import {
//    GEN_MODEL_SEED_ADAPTER_ID,
//    GEN_MODEL_SEED_TYPE_EXTENSION_POINT,
// } from "../interface/SeedTypeExtensionPoint.js"
import { IGenModelSeedExtension } from "../interface/IGenModelSeedExtension.js"
import {
   IExtensionClass,
   KnownExtensionIds,
} from "../../extensions/interface/IExtension.js"
import { IAdapterFactory } from "../../extensions/interface/IAdapterFactory.js"
import { GenModelSeedAdapter } from "./GenModelSeedAdapter.js"
import { GEN_MODEL_SEED_TYPE_EXTENSION_POINT } from "../interface/SeedTypeExtensionPoint.js"
import {
   ExtensionAdapterURIFromParts,
   ExtensionAdapterURItoKind,
} from "../../extensions/interface/IExtensionAdapter.js"

// type ModelFor<
//    ExtensionId extends KnownPayloadIds<ExtensionPoint> & KnownTArgsIds<ExtensionPoint>,
//    T extends ExtensionBase<ExtensionId>,
// > = T extends IGenModelSeedExtension<ExtensionId, infer M> ? M : never

type ExtensionBase<ExtensionId extends KnownExtensionIds<ExtensionPoint>> =
   IExtensionClass<GEN_MODEL_SEED_TYPE_EXTENSION_POINT, ExtensionId>



export const f: ExtensionAdapterURItoKind<
   ExtensionAdapterURIFromParts<
      GEN_MODEL_SEED_TYPE_EXTENSION_POINT,
      GEN_MODEL_SEED_ADAPTER_ID
   >
> = {
   validate(seed: object): void {},
}

export class GenModelSeedAdapterFactory
   implements
      IAdapterFactory<
         GEN_MODEL_SEED_TYPE_EXTENSION_POINT,
         GEN_MODEL_SEED_ADAPTER_ID
      >
{
   adapt<
      ExtensionId extends
         KnownExtensionIds<GEN_MODEL_SEED_TYPE_EXTENSION_POINT>,
      ExtensionClass extends ExtensionBase<ExtensionId>,
   >(
      _key: ExtensionId,
      extensionClass: ExtensionClass,
      extension: InstanceType<ExtensionClass> &
         IGenModelSeedExtension<ExtensionId>,
   ): GenModelSeedAdapter<ExtensionId> {
      return new GenModelSeedAdapter(extensionClass, extension)
   }
}

// type A = IExtensionClass<"a", "b"> & Type<IGenModelSeedExtension<"b">>
// type AS<
//    A extends IExtensionClass<
//       GEN_MODEL_SEED_TYPE_EXTENSION_POINT,
//       HEX_SEED_EXTENSION_ID
//    > &
//       Type<IGenModelSeedExtension<HEX_SEED_EXTENSION_ID, any>>,
// > = A
// type C = AS<typeof HexSeedExtension>
// type B = InstanceType<C>
// export const an: B = new HexSeedExtension()
