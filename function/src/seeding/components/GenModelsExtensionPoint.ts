import { GEN_MODEL_SEED_ADAPTER_ID } from "./../builtin/interface/Constants"
import { IAdapterCollection } from "../../extensions/interface/IAdapterCollection.js"
import {
   IExtension,
   KnownExtensionIds,
} from "../../extensions/interface/IExtension.js"
import { IExtensionCollection } from "../../extensions/interface/IExtensionCollection.js"
import { IExtensionMatchmaker } from "../../extensions/interface/IExtensionMatchmaker.js"
import { IExtensionPoint } from "../../extensions/interface/IExtensionPoint.js"
import { IGenModelSeedExtension } from "../interface/IGenModelSeedExtension.js"
import { IGenModelSeedExtensionPoint } from "../interface/IGenModelSeedExtensionPoint.js"
import { SeedTypeByExtension } from "../interface/SeedTypeByExtension.js"
import { ReturnableSeedType } from "../interface/SeedTypes.js"
import {
   GEN_MODEL_SEED_ADAPTER_ID_STR,
   GEN_MODEL_SEED_TYPE_EXTENSION_POINT,
} from "./../interface/SeedTypeExtensionPoint"
import { GenModelSeedAdapter } from "./GenModelSeedAdapter.js"
import { GenModelSeedAdapterFactory } from "./GenModelSeedAdapterFactory.js"

// type InstantiableAdapterCtor<
//    ExtensionPoint extends string,
//    PayloadType extends object,
//    TArgs extends any[],
// > = new <ExtensionId extends KnownPayloadIds<ExtensionPoint> & KnownTArgsIds<ExtensionPoint>>(...args: any[]) => IExtension

export class GenModelSeedExtensionPoint
   implements
      IExtensionPoint<GEN_MODEL_SEED_TYPE_EXTENSION_POINT>,
      IGenModelSeedExtensionPoint
{
   constructor(
      private readonly matchMaker: IExtensionMatchmaker<GEN_MODEL_SEED_TYPE_EXTENSION_POINT>,
      private readonly adapterFactory: GenModelSeedAdapterFactory,
   ) {
      matchMaker.registerExtensionPoint(this)
      matchMaker.registerAdapterFactory(
         GEN_MODEL_SEED_ADAPTER_ID_STR,
         this.adapterFactory,
      )
   }

   private extensions:
      | IExtensionCollection<GEN_MODEL_SEED_TYPE_EXTENSION_POINT>
      | undefined

   private adapters:
      | IAdapterCollection<
           GEN_MODEL_SEED_TYPE_EXTENSION_POINT,
           GEN_MODEL_SEED_ADAPTER_ID
        >
      | undefined

   receiveExtensions(
      extensions: IExtensionCollection<GEN_MODEL_SEED_TYPE_EXTENSION_POINT>,
      adapters: {
         [x in string]: IAdapterCollection<
            GEN_MODEL_SEED_TYPE_EXTENSION_POINT,
            x
         >
      },
   ): void {
      this.extensions = extensions
      this.adapters = adapters[GEN_MODEL_SEED_ADAPTER_ID_STR]
   }

   validate<
      ExtensionId extends
         KnownExtensionIds<GEN_MODEL_SEED_TYPE_EXTENSION_POINT>,
   >(extensionId: ExtensionId, input: SeedTypeByExtension<ExtensionId>): void {}

   toSeedModel<
      ExtensionId extends
         KnownExtensionIds<GEN_MODEL_SEED_TYPE_EXTENSION_POINT>,
   >(
      extensionId: ExtensionId,
      input: SeedTypeByExtension<ExtensionId>,
   ): ReturnableSeedType {
      if (this.extensions === undefined || this.adapters === undefined) {
         throw new Error(
            "Only call toSeedModel() after the ApplicationInitialization lifecycle event!",
         )
      }
      // const adapter: GenModelSeedAdapter<ExtensionId> =
      const clazz = this.extensions.getClass(extensionId)
      if (clazz === undefined) {
         throw new Error(
            `No extension class registered under ${extensionId} was found`,
         )
      }
      const extension = this.extensions.get(extensionId, clazz)
      if (extension === undefined) {
         throw new Error(
            `Extension ${extensionId} has class ${clazz.name}, but no instance of it was found`,
         )
      }
      const adapter = this.adapters.adapt(extensionId, clazz, extension)

      return undefined
   }
}
