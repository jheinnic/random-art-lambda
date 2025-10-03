import { Type } from "@nestjs/common"

import {
   GEN_MODEL_SEED_TYPE_EXTENSION_POINT,
   GenModelSeedClass,
} from "../interface/SeedTypeExtensionPoint.js"
import { IGenModelSeedExtension } from "../interface/IGenModelSeedExtension.js"
import { IExtensionClass } from "../../extensions/interface/IExtension.js"
import { IAdapterFactory } from "../../extensions/interface/IAdapterFactory.js"
import { GenModelSeedAdapter } from "./GenModelSeedAdapter.js"
import { SeedTypeByExtension } from "../interface/SeedTypeByExtension.js"

// type ModelFor<
//    ExtensionId extends string,
//    T extends ExtensionBase<ExtensionId>,
// > = T extends IGenModelSeedExtension<ExtensionId, infer M> ? M : never

type ExtensionBase<ExtensionId extends string> = IExtensionClass<
   GEN_MODEL_SEED_TYPE_EXTENSION_POINT,
   ExtensionId,
   IGenModelSeedExtension<ExtensionId>,
   []
>

// type IRT<
//    X,
//    T extends abstract new <X>(...args: any) => any,
// > = T extends abstract new <X>(...args: any) => infer R ? R : any

export class GenModelSeedAdapterFactory
   implements
      IAdapterFactory<
         GEN_MODEL_SEED_TYPE_EXTENSION_POINT,
         IGenModelSeedExtension<ExtensionId>,
         [],
         GenModelSeedAdapter
      >
{
   adapt<
      ExtensionId extends string,
      ExtensionClass extends ExtensionBase<ExtensionId>,
   >(
      extensionId: ExtensionId,
      extensionClass: ExtensionClass,
      extension: InstanceType<ExtensionClass>,
   ): GenModelSeedAdapter {
      return new GenModelSeedAdapter(extensionId, extensionClass, extension)
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
