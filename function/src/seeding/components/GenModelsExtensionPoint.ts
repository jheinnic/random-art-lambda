import { IExtension } from "../../extensions/interface/IExtension.js"
import { IExtensionCollection } from "../../extensions/interface/IExtensionCollection.js"
import { IExtensionMatchmaker } from "../../extensions/interface/IExtensionMatchmaker.js"
import { IExtensionPoint } from "../../extensions/interface/IExtensionPoint.js"
import { IGenModelSeedExtension } from "../interface/IGenModelSeedExtension.js"
import { IGenModelSeedExtensionPoint } from "../interface/IGenModelSeedExtensionPoint.js"
import { SeedTypeByExtension } from "../interface/SeedTypeByExtension.js"
import { ReturnableSeedType } from "../interface/SeedTypes.js"
import { GEN_MODEL_SEED_TYPE_EXTENSION_POINT } from "./../interface/SeedTypeExtensionPoint"
import { GenModelSeedAdapter } from "./GenModelSeedAdapter.js"
import { GenModelSeedAdapterFactory } from "./GenModelSeedAdapterFactory.js"

type InstantiableAdapterCtor<
   ExtensionPoint extends string,
   PayloadType extends IExtension,
   TArgs extends any[],
> = new <ExtensionId extends string>(...args: any[]) => IExtension

export class GenModelSeedExtensionPoint
   implements
      IExtensionPoint<
         GEN_MODEL_SEED_TYPE_EXTENSION_POINT,
         [typeof GenModelSeedAdapter]
      >
{
   //       PayloadType extends IExtension,
   //       TArgs extends any[],
   //       IGenModelSeedExtensionPoint,
   // }
   constructor(
      private readonly matchMaker: IExtensionMatchmaker<
         GEN_MODEL_SEED_TYPE_EXTENSION_POINT,
         PayloadType,
         TArgs
      >,
      private readonly adapterFactory: GenModelSeedAdapterFactory,
   ) {
      matchMaker.registerExtensionPoint(this)
      matchMaker.registerAdapterFactory(new GenModelSeedAdapterFactory())
   }

   private extensions:
      | IExtensionCollection<
           GEN_MODEL_SEED_TYPE_EXTENSION_POINT,
           IGenModelSeedExtension<string>,
           [typeof GenModelSeedAdapter]
        >
      | undefined

   receiveExtensions<_ExtensionIds extends string>(
      extensions: IExtensionCollection<
         GEN_MODEL_SEED_TYPE_EXTENSION_POINT,
         IGenModelSeedExtension<string>,
         [typeof GenModelSeedAdapter]
      >,
   ): void {
      this.extensions = extensions
      // this.extensions.adaptAs(typeof GenModelSeedAdapter,)
   }

   toSeedModel<_ExtensionId extends string>(
      _input: object,
   ): ReturnableSeedType | undefined {
      // const adapter: GenModelSeedAdapter<ExtensionId> =
      return undefined
   }
}
