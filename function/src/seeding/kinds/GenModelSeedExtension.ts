import {
   GEN_MODEL_SEED_ADAPTER_ID_STR,
   GEN_MODEL_SEED_EXTENSION_POINT_STRING,
} from "./Constants"
import { GenModelSeedAdapter } from "../components/GenModelSeedAdapter.js"
import {
   KnownExtensionIds,
   KnownExtensionPointIds,
} from "../../extensions/kinds/index.js"
import { IGenModelSeedExtension } from "../interface/IGenModelSeedExtension.js"
import { IGenModelSeedStaticExtension } from "../interface/IGenModelSeedStaticExtension.js"
import { GenModelExtensions } from "./GenModelSeedModule.js"

declare module "../../extensions/kinds/ExtensionPointKind.js" {
   export interface ToExtPayloadKind<ExtensionId extends string> {
      [GEN_MODEL_SEED_EXTENSION_POINT_STRING]: IGenModelSeedExtension<ExtensionId>
   }

   export interface ToExtTArgsKind<ExtensionId extends string> {
      [GEN_MODEL_SEED_EXTENSION_POINT_STRING]: []
   }

   export interface ToExtStaticBodyKind<ExtensionId extends string> {
      [GEN_MODEL_SEED_EXTENSION_POINT_STRING]: IGenModelSeedStaticExtension<ExtensionId>
   }

   export interface ToExtAdaptersRefKind<ExtensionId extends string> {
      [GEN_MODEL_SEED_EXTENSION_POINT_STRING]: {
         [GEN_MODEL_SEED_ADAPTER_ID_STR]: GenModelSeedAdapter<ExtensionId>
      }
   }

   export interface ToExtensionsRefKind {
      [GEN_MODEL_SEED_EXTENSION_POINT_STRING]: GenModelExtensions
   }
}
// declare module "../../extensions/kinds/ExtensionAdapterKind.js" {
//    export interface ExtensionAdapterURItoKind<
//       ExtensionPoint extends KnownExtensionPointIds,
//       ExtensionId extends KnownExtensionIds<ExtensionPoint>,
//    > {
//       readonly "GenModelSeed/GenModelSeedAdapter": GenModelSeedAdapter<ExtensionId>
//    }
// }
