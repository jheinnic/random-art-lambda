import { Observable, of, from } from "rxjs"

import {
   GEN_MODEL_SEED_ADAPTER_ID,
   GEN_MODEL_SEED_ADAPTER_ID_STR,
   GEN_MODEL_SEED_EXTENSION_POINT,
   PAINTABLE_PHRASE_PAIR_STR,
   PAINTABLE_PREFIX_SUFFIX_STR,
   PAINTABLE_SINGLE_PHRASE_STR,
} from "../kinds/Constants.js"
import {
   KnownExtensionClassIds,
   PayloadTypeKind,
} from "../../extensions/kinds/ExtensionClassKind.js"
import { IAdapterCollection } from "../../extensions/interface/IAdapterCollection.js"
import { IExtensionCollection } from "../../extensions/interface/IExtensionCollection.js"
import { IExtensionMatchmaker } from "../../extensions/interface/IExtensionMatchmaker.js"
import { IExtensionPoint } from "../../extensions/interface/IExtensionPoint.js"
import { PaintableSeed } from "../models/PaintableSeed.js"
import { SeedByExtension } from "../models/SeedByExtension.js"
import { IGenModelSeedExtensionPoint } from "../interface/IGenModelSeedExtensionPoint.js"
import { GenModelSeedAdapterFactory } from "./GenModelSeedAdapterFactory.js"
import {
   GenModelSeedExtensionKind,
   GenModelSeedPayloadKind,
} from "../kinds/GenModelSeedExtensionKind.js"
import { GenModelSeedAdapter } from "./GenModelSeedAdapter.js"
import { Inject, Injectable } from "@nestjs/common"
import { SeedingModuleTypes } from "../di/Types.js"

@Injectable()
export class GenModelSeedExtensionPoint
   implements
      IExtensionPoint<GEN_MODEL_SEED_EXTENSION_POINT>,
      IGenModelSeedExtensionPoint
{
   constructor(
      @Inject(SeedingModuleTypes.GenModelSeedMatchmaker)
      private readonly matchMaker: IExtensionMatchmaker<GEN_MODEL_SEED_EXTENSION_POINT>,
      @Inject(SeedingModuleTypes.GenModelSeedAdapterFactory)
      private readonly adapterFactory: GenModelSeedAdapterFactory,
   ) {
      matchMaker.registerExtensionPoint(this)
      matchMaker.registerAdapterFactory(
         GEN_MODEL_SEED_ADAPTER_ID_STR,
         this.adapterFactory,
      )
   }

   private extensions:
      | IExtensionCollection<GEN_MODEL_SEED_EXTENSION_POINT>
      | undefined

   private adapters:
      | IAdapterCollection<
           GEN_MODEL_SEED_EXTENSION_POINT,
           GEN_MODEL_SEED_ADAPTER_ID
        >
      | undefined

   receiveExtensions(
      extensions: IExtensionCollection<GEN_MODEL_SEED_EXTENSION_POINT>,
      adapters: {
         [GEN_MODEL_SEED_ADAPTER_ID_STR]: IAdapterCollection<
            GEN_MODEL_SEED_EXTENSION_POINT,
            GEN_MODEL_SEED_ADAPTER_ID
         >
      },
   ): void {
      this.extensions = extensions
      this.adapters = adapters[GEN_MODEL_SEED_ADAPTER_ID_STR]
   }

   toSeedModel(
      extensionKey: PaintableSeed["seedKey"],
      input: PaintableSeed,
   ): Observable<PaintableSeed>
   toSeedModel(
      extensionKey: KnownExtensionClassIds<GEN_MODEL_SEED_EXTENSION_POINT>,
      input: SeedByExtension<typeof extensionKey>,
   ): Observable<PaintableSeed>
   toSeedModel(
      extensionKey:
         | PaintableSeed["seedKey"]
         | KnownExtensionClassIds<GEN_MODEL_SEED_EXTENSION_POINT>,
      input:
         | SeedByExtension<
              Exclude<typeof extensionKey, PaintableSeed["seedKey"]>
           >
         | PaintableSeed,
   ): Observable<PaintableSeed> {
      // if ("seedKey" in key) {
      //    return key
      // }

      if (this.extensions === undefined || this.adapters === undefined) {
         throw new Error(
            "Only call toSeedModel() after the ApplicationInitialization lifecycle event!",
         )
      }

      if (
         input.seedKey === PAINTABLE_PHRASE_PAIR_STR ||
         input.seedKey === PAINTABLE_PREFIX_SUFFIX_STR ||
         input.seedKey === PAINTABLE_SINGLE_PHRASE_STR
      ) {
         return of(input)
      }

      const extensionClass: GenModelSeedExtensionKind<
         Exclude<typeof extensionKey, PaintableSeed["seedKey"]>
      > = this.extensions.getClass(input.seedKey)
      if (extensionClass === undefined) {
         throw new Error(
            `No extension class registered under ${input.seedKey} was found`,
         )
      }

      const extension: GenModelSeedPayloadKind<
         Exclude<typeof extensionKey, PaintableSeed["seedKey"]>
      > = this.extensions.get(input.seedKey)
      if (extension === undefined) {
         throw new Error(
            `Extension ${input.seedKey} has class ${extensionClass.name}, but no instance of it was found`,
         )
      }
      const adapter: GenModelSeedAdapter<
         Exclude<typeof extensionKey, PaintableSeed["seedKey"]>
      > = this.adapters.adapt(input.seedKey, extensionClass, extension)

      return adapter.toModel(input)
   }
}
