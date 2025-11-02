import {
   GEN_MODEL_BATCH_EXTENSION_POINT_STRING,
   GEN_MODEL_SEED_ADAPTER_ID_STR,
   GEN_MODEL_SEED_EXTENSION_POINT,
   GEN_MODEL_SEED_EXTENSION_POINT_STRING,
} from "./Constants"
import { GenModelSeedAdapter } from "../components/GenModelSeedAdapter.js"
import {
   CandidateExtensionIds,
   KnownExtensionIds,
} from "../../extensions/kinds/index.js"
import { IGMSeedExtPayload } from "../interface/IGMSeedExtPayload.js"
import { ToGMSeedExtClassKind } from "./GenModelSeedModule.js"

declare module "../../extensions/kinds/ExtensionPoints.js" {
   export interface PointForExtPayload<_ExtensionId extends string> {
      [GEN_MODEL_SEED_EXTENSION_POINT_STRING]: IGMSeedExtPayload<
         Extract<
            _ExtensionId,
            CandidateExtensionIds<GEN_MODEL_SEED_EXTENSION_POINT>
         >
      >
      [GEN_MODEL_BATCH_EXTENSION_POINT_STRING]: {}
   }

   export interface PointForExtTArgs<_ExtensionId extends string> {
      [GEN_MODEL_SEED_EXTENSION_POINT_STRING]: []
      [GEN_MODEL_BATCH_EXTENSION_POINT_STRING]: []
   }

   export interface PointForExtStaticPayload<_ExtensionId extends string> {
      [GEN_MODEL_SEED_EXTENSION_POINT_STRING]: {}
      [GEN_MODEL_BATCH_EXTENSION_POINT_STRING]: {}
   }

   export interface PointForPointForAdapterFactory<ExtensionId extends string> {
      [GEN_MODEL_SEED_EXTENSION_POINT_STRING]: {
         [GEN_MODEL_SEED_ADAPTER_ID_STR]: GenModelSeedAdapter<
            Extract<
               ExtensionId,
               KnownExtensionIds<GEN_MODEL_SEED_EXTENSION_POINT>
            >
         >
      }
      [GEN_MODEL_BATCH_EXTENSION_POINT_STRING]: {}
   }

   export interface PointForPointForExtensions {
      [GEN_MODEL_SEED_EXTENSION_POINT_STRING]: ToGMSeedExtClassKind
      [GEN_MODEL_BATCH_EXTENSION_POINT_STRING]: {}
   }
}
