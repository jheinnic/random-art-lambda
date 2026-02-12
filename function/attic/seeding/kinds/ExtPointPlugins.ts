import { CandidateGenModelSeedExtensionIds } from "./GenModelSeedKind"
import {
   GEN_MODEL_BATCH_EXTENSION_POINT_STRING,
   GEN_MODEL_SEED_ADAPTER_ID_STRING,
   GEN_MODEL_SEED_EXTENSION_POINT,
   GEN_MODEL_SEED_EXTENSION_POINT_STRING,
} from "./Constants"
import { HooksForGMSeedExtensionClass } from "./GenModelSeedHooks.js"
import { KnownExtensionIds } from "../../../extensions/kinds/index.js"

import { IGMSeedExtPayload } from "../interface/IGMSeedExtPayload.js"
import { GenModelSeedAdapter } from "../components/GenModelSeedAdapter.js"

declare module "../../../extensions/kinds/ExtPointHooks.js" {
   export interface HooksForExtPayload<_ExtensionId extends string> {
      [GEN_MODEL_SEED_EXTENSION_POINT_STRING]: IGMSeedExtPayload<
         Extract<_ExtensionId, CandidateGenModelSeedExtensionIds>
      >
      [GEN_MODEL_BATCH_EXTENSION_POINT_STRING]: {}
   }

   export interface HooksForExtTArgs<_ExtensionId extends string> {
      [GEN_MODEL_SEED_EXTENSION_POINT_STRING]: []
      [GEN_MODEL_BATCH_EXTENSION_POINT_STRING]: []
   }

   export interface HooksForExtStaticPayload<_ExtensionId extends string> {
      [GEN_MODEL_SEED_EXTENSION_POINT_STRING]: {}
      [GEN_MODEL_BATCH_EXTENSION_POINT_STRING]: {}
   }

   export interface HooksForHooksForAdapterFactory<ExtensionId extends string> {
      [GEN_MODEL_SEED_EXTENSION_POINT_STRING]: {
         [GEN_MODEL_SEED_ADAPTER_ID_STRING]: GenModelSeedAdapter<
            Extract<
               ExtensionId,
               KnownExtensionIds<GEN_MODEL_SEED_EXTENSION_POINT>
            >
         >
      }
      [GEN_MODEL_BATCH_EXTENSION_POINT_STRING]: {}
   }

   export interface HooksForHooksForExtensionClasses {
      [GEN_MODEL_SEED_EXTENSION_POINT_STRING]: HooksForGMSeedExtensionClass
      [GEN_MODEL_BATCH_EXTENSION_POINT_STRING]: {}
   }
}
