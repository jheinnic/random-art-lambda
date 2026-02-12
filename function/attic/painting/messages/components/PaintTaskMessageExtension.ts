import {
   Inferred,
   ITypeMapExtension,
} from "../../../messages/interface/ITypeMapExtension.js"
import {
   FromTypeMapKind,
   ToTypeMapKind,
} from "../../../messages/kinds/WireTxKind.js"
import {
   CID_MAP_RULE,
   CID_MAP_RULE_STRING,
   UINT32ARRAY_MAP_RULE,
   UINT32ARRAY_MAP_RULE_STRING,
   PAINT_TASK_MESSAGE_EXTENSION,
} from "./../kinds/Constants"
import { CIDUtil } from "../../utility/CIDUtil.js"
import { CID } from "multiformats"
import { RuleNameIfMapped } from "../../../messages/interface/Translated.js"

export class PaintTaskMessageExtension
   implements ITypeMapExtension<PAINT_TASK_MESSAGE_EXTENSION>
{
   selectRule(
      sourceValue: any,
   ):
      | RuleNameIfMapped<
           Inferred<typeof sourceValue>,
           FromTypeMapKind<PAINT_TASK_MESSAGE_EXTENSION>
        >
      | undefined {
      if (sourceValue instanceof Uint32Array) {
         return UINT32ARRAY_MAP_RULE_STRING
      }
      if (sourceValue instanceof CID) {
         return CID_MAP_RULE_STRING
      }
      // returned with a little less on Handlers.
      return undefined
   }

   encodeValue(
      ruleName: "forCid" | "forUint32Array",
      sourceValue: FromTypeMapKind<PAINT_TASK_MESSAGE_EXTENSION>[typeof ruleName],
   ): ToTypeMapKind<PAINT_TASK_MESSAGE_EXTENSION>[typeof ruleName] {
      let retVal: string
      switch (ruleName) {
         case "forCid": {
            const value: CID = sourceValue as CID
            retVal = value.toString()
            break
         }
         case "forUint32Array": {
            const value: Uint32Array = sourceValue as Uint32Array
            const buffer = Buffer.from(value.buffer)
            retVal = buffer.toString("base64")
            break
         }
      }
      return retVal
   }

   // decodeValue<K extends "forCid" | "forUint32Array">(
   decodeValue(
      ruleName: "forCid" | "forUint32Array",
      encodedValue: ToTypeMapKind<PAINT_TASK_MESSAGE_EXTENSION>[typeof ruleName],
   ): FromTypeMapKind<PAINT_TASK_MESSAGE_EXTENSION>[typeof ruleName] {
      let retVal: FromTypeMapKind<PAINT_TASK_MESSAGE_EXTENSION>[typeof ruleName]
      switch (ruleName) {
         case "forCid": {
            retVal = CIDUtil.parseCID(encodedValue)
            break
         }
         case "forUint32Array": {
            const newBuffer = Buffer.from(encodedValue, "base64")
            retVal = new Uint32Array(
               newBuffer.buffer,
               newBuffer.byteOffset,
               newBuffer.byteLength / 4,
            )
         }
      }
      return retVal
   }

   // public get getRuleNames(): [CID_MAP_RULE, UINT32ARRAY_MAP_RULE] {
   //    return [CID_MAP_RULE_STRING, UINT32ARRAY_MAP_RULE_STRING]
   // }
}
