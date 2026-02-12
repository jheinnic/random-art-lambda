import {
   TYPE_MAP_ADAPTER_ID,
   TYPE_MAP_EXTENSION_POINT,
} from "../kinds/Constants.js"
import { IAdapterFactory } from "../../extensions/interface/IAdapterFactory.js"
export interface IWireCodecAdapterFactory
   extends IAdapterFactory<TYPE_MAP_EXTENSION_POINT, TYPE_MAP_ADAPTER_ID> {}
