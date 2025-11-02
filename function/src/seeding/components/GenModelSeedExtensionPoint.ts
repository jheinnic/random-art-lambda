import { IGMSeedAdapterFactory } from "./../interface/IGMSeedAdapterFactory"
import { KnownGenModelSeedExtensionIds } from "./../kinds/GenModelSeedKind"
import { Inject, Injectable } from "@nestjs/common"
import { Observable, of } from "rxjs"

import {
   GEN_MODEL_SEED_ADAPTER_ID,
   GEN_MODEL_SEED_ADAPTER_ID_STR,
   GEN_MODEL_SEED_EXTENSION_POINT,
   PAINTABLE_PHRASE_PAIR_STR,
   PAINTABLE_PREFIX_SUFFIX_STR,
   PAINTABLE_SINGLE_PHRASE_STR,
} from "../kinds/Constants.js"
import { KnownExtensionIds } from "../../extensions/kinds/ExtensionKind.js"

import { SeedingModuleTypes } from "../di/Types.js"

import { SeedType } from "../models/SeedType.js"
import { PaintableSeed } from "../models/PaintableSeed.js"
import { SeedByExtension } from "../models/SeedByExtension.js"

import {
   IAdapterCollection,
   IExtensionCollection,
   IExtensionMatchmaker,
} from "../../extensions/interface/index.js"
import { IGMSeedExtensionPoint, IGMSeedExtPayload } from "../interface/index.js"

import { GenModelSeedAdapter } from "./GenModelSeedAdapter.js"

const DUMMY: IExtensionCollection<GEN_MODEL_SEED_EXTENSION_POINT> &
   IAdapterCollection<
      GEN_MODEL_SEED_EXTENSION_POINT,
      GEN_MODEL_SEED_ADAPTER_ID
   > = {} as unknown as any

@Injectable()
export class GenModelSeedExtensionPoint implements IGMSeedExtensionPoint {
   constructor(
      @Inject(SeedingModuleTypes.GMSeedExtensionMatchmaker)
      readonly matchMaker: IExtensionMatchmaker<GEN_MODEL_SEED_EXTENSION_POINT>,
      @Inject(SeedingModuleTypes.GMSeedAdapterFactory)
      readonly adapterFactory: IGMSeedAdapterFactory,
   ) {
      matchMaker.registerExtensionPoint(this)
      matchMaker.registerAdapterFactory(
         GEN_MODEL_SEED_ADAPTER_ID_STR,
         adapterFactory,
      )
   }

   private extensions: IExtensionCollection<GEN_MODEL_SEED_EXTENSION_POINT> =
      DUMMY

   private adapters: IAdapterCollection<
      GEN_MODEL_SEED_EXTENSION_POINT,
      GEN_MODEL_SEED_ADAPTER_ID
   > = DUMMY

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
      input: PaintableSeed | SeedByExtension<KnownGenModelSeedExtensionIds>,
   ): Observable<PaintableSeed> {
      if (isPaintableSeedType(input)) {
         return of(input)
      }

      if (this.extensions === DUMMY || this.adapters === DUMMY) {
         throw new Error(
            "Only call toSeedModel() after the ApplicationInitialization lifecycle event!",
         )
      }

      const extension: IGMSeedExtPayload<typeof input.seedKey> =
         this.extensions.get(input.seedKey)
      const adapter: GenModelSeedAdapter<typeof input.seedKey> =
         this.adapters.adapt(input.seedKey, extension)

      return of(adapter.toPaintable(input))
   }
}

const BUILT_IN_TYPES = new Set([
   PAINTABLE_PHRASE_PAIR_STR,
   PAINTABLE_PREFIX_SUFFIX_STR,
   PAINTABLE_SINGLE_PHRASE_STR,
])
function isPaintableSeedType(
   input: SeedType<
      | PaintableSeed["seedKey"]
      | KnownExtensionIds<GEN_MODEL_SEED_EXTENSION_POINT>
   >,
): input is PaintableSeed {
   return input.seedKey in BUILT_IN_TYPES
}
