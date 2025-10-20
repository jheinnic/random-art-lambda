import { Observable } from "rxjs"
import { IAdapterCollection } from "../../extensions/interface/IAdapterCollection.js"
import { KnownExtensionIds } from "../../extensions/interface/IExtension.js"
import { KnownAdapterIds } from "../../extensions/interface/IExtensionAdapter.js"
import { IExtensionCollection } from "../../extensions/interface/IExtensionCollection.js"
import { IExtensionMatchmaker } from "../../extensions/interface/IExtensionMatchmaker.js"
import { IExtensionPoint } from "../../extensions/interface/IExtensionPoint.js"
import { IGenModelSeedExtensionPoint } from "../interface/IGenModelSeedExtensionPoint.js"
import { SeedModelKind } from "../interface/SeedModelKind.js"
import {
   GEN_MODEL_SEED_ADAPTER_ID,
   GEN_MODEL_SEED_ADAPTER_ID_STR,
   GEN_MODEL_SEED_TYPE_EXTENSION_POINT,
} from "./../interface/SeedTypeExtensionPoint"
import { GenModelSeedAdapterFactory } from "./GenModelSeedAdapterFactory.js"
import { SeedType } from "../interface/SeedTypes.js"

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
         [x in KnownAdapterIds<GEN_MODEL_SEED_TYPE_EXTENSION_POINT>]: IAdapterCollection<
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
   >(_extensionId: ExtensionId, _input: SeedModelKind<ExtensionId>): void {}

   toSeedModel<
      ExtensionId extends
         KnownExtensionIds<GEN_MODEL_SEED_TYPE_EXTENSION_POINT>,
   >(
      extensionId: ExtensionId,
      input: SeedModelKind<ExtensionId>,
   ): Observable<SeedType> {
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

      return adapter.toModel(input)
   }
}
