// SHELVED: This file depends on type mapping extension system which has been moved to attic/
// This entire file has been commented out since it's not currently used.

/*
import type { CID } from "multiformats"
import type { ITypeMapExtension } from "../../../messages/interface/ITypeMapExtension.js"
import {
   PAINT_TASK_MESSAGE_EXTENSION_STRING,
   CID_MAP_RULE,
   UINT32ARRAY_MAP_RULE,
   CID_MAP_RULE_STRING,
   UINT32ARRAY_MAP_RULE_STRING,
   PAINT_TASK_TYPE_MAP_EXTENSION_ID,
   PAINT_TASK_TYPE_MAP_EXTENSION_POINT,
} from "./Constants.js"
import type { PaintTaskMessageExtension } from "../components/PaintTaskMessageExtension.js"

declare module "../../../messages/kinds/WireTxHooks.js" {
   interface HookForMapFromTypes {
      readonly [PAINT_TASK_MESSAGE_EXTENSION_STRING]: {
         readonly forCid: CID
         readonly [UINT32ARRAY_MAP_RULE_STRING]: Uint32Array
      }
   export interface HookForMapFromTypes {
      [PAINT_TASK_TYPE_MAP_EXTENSION_ID]: CID | Uint32Array
   }

   interface HookForMapToTypes {
      readonly [PAINT_TASK_MESSAGE_EXTENSION_STRING]: {
         readonly [CID_MAP_RULE_STRING]: string
         readonly forUint32Array: string
      }
   export interface HookForMapToTypes {
      [PAINT_TASK_TYPE_MAP_EXTENSION_ID]: string
   }

   interface HookForMapRuleNames {
      readonly [PAINT_TASK_MESSAGE_EXTENSION_STRING]: readonly [
         CID_MAP_RULE,
         UINT32ARRAY_MAP_RULE,
      ]
   }

   interface HookForTypeMapExtensions {
      readonly [PAINT_TASK_MESSAGE_EXTENSION_STRING]: PaintTaskMessageExtension
   export interface HookForTypeMapExtensions {
      [PAINT_TASK_TYPE_MAP_EXTENSION_ID]: ITypeMapExtension<
         typeof PAINT_TASK_TYPE_MAP_EXTENSION_ID
      >
   }
}
*/
