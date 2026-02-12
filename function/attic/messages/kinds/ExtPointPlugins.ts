// SHELVED: This file depends on extension points and type mapping which have been moved to attic/
// This entire file has been commented out since it's not currently used.

/*
// import { CandidateGenModelSeedExtensionIds } from "./GenModelSeedKind"
import {
   TYPE_MAP_ADAPTER_ID_STRING,
   TYPE_MAP_EXTENSION_POINT,
   TYPE_MAP_EXTENSION_POINT_STRING,
} from "./Constants.js"
import { KnownExtensionIds } from "../../extensions/kinds/index.js"
import { ITypeMapExtension } from "../interface/ITypeMapExtension.js"

import {
   CandidateTypeMapExtensionIds,
   KnownTypeMapExtensions,
   MapRuleNamesKind,
} from "./WireTxKind.js"
import { WireCodecAdapter } from "../components/WireCodecAdapter.js"
import type { ResolveExtensionTypeByName } from "../../extensions/kinds/index.js"
import type {
   ITransformedAdapter,
   ITypeMapExtension,
   NamedTypeMapExtension,
} from "../interface/ITypeMapExtension.js"
import type { ITypeMapExtensionPoint } from "../interface/ITypeMapExtensionPoint.js"

declare module "./WireTxKind.js" {
   interface WireTxHooks {}
}

import type { WireTxExtensionPoint } from "../components/WireCodecAdapter.js"

declare module "../../extensions/kinds/ExtPointHooks.js" {
   export interface HooksForExtPayload<_ExtensionId extends string> {
      [TYPE_MAP_EXTENSION_POINT_STRING]: ITypeMapExtension<
         Extract<_ExtensionId, CandidateTypeMapExtensionIds>
      >
   }

   export interface HooksForExtTArgs<_ExtensionId extends string> {
      [TYPE_MAP_EXTENSION_POINT_STRING]: [
         MapRuleNamesKind<Extract<_ExtensionId, CandidateTypeMapExtensionIds>>,
      ]
   }

   export interface HooksForExtStaticPayload<_ExtensionId extends string> {
      [TYPE_MAP_EXTENSION_POINT_STRING]: {}
   }

   export interface HooksForHooksForAdapterFactory<ExtensionId extends string> {
      [TYPE_MAP_EXTENSION_POINT_STRING]: {
         [TYPE_MAP_ADAPTER_ID_STRING]: WireCodecAdapter<
            Extract<ExtensionId, KnownExtensionIds<TYPE_MAP_EXTENSION_POINT>>
         >
      }
   }

   export interface HooksForHooksForExtensionClasses {
      [TYPE_MAP_EXTENSION_POINT_STRING]: KnownTypeMapExtensions
   export interface HooksForExtPoints {
      wireTypeMappings: WireTxExtensionPoint
   }
}
*/
