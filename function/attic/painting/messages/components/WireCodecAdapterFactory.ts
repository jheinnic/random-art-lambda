import {
   KnownExtensionIds,
   ExtensionPayloadKind,
} from "../../extensions/kinds/ExtPointKind.js"
import { IAdapterFactory } from "../../extensions/interface/IAdapterFactory.js"
import { WireCodecAdapter } from "./WireCodecAdapter.js"
import {
   TYPE_MAP_EXTENSION_POINT_STRING,
   TYPE_MAP_ADAPTER_ID_STRING,
   TYPE_MAP_ADAPTER_ID,
   TYPE_MAP_EXTENSION_POINT,
} from "../kinds/Constants.js"
import { Injectable } from "@nestjs/common"

@Injectable()
export class WireCodecAdapterFactory
   implements IAdapterFactory<TYPE_MAP_EXTENSION_POINT, TYPE_MAP_ADAPTER_ID>
{
   readonly extensionPoint: TYPE_MAP_EXTENSION_POINT =
      TYPE_MAP_EXTENSION_POINT_STRING

   readonly adapterId: TYPE_MAP_ADAPTER_ID = TYPE_MAP_ADAPTER_ID_STRING

   adapt(
      extensionId: KnownExtensionIds<TYPE_MAP_EXTENSION_POINT>,
      extension: ExtensionPayloadKind<
         TYPE_MAP_EXTENSION_POINT,
         typeof extensionId
      >,
   ): WireCodecAdapter<typeof extensionId> {
      return new WireCodecAdapter<typeof extensionId>(extensionId, extension)
   }
}
