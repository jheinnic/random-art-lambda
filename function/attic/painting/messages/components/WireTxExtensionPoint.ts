import { Inject, Injectable } from "@nestjs/common"

import {
   TYPE_MAP_ADAPTER_ID,
   TYPE_MAP_ADAPTER_ID_STRING,
   TYPE_MAP_EXTENSION_POINT,
} from "../kinds/Constants.js"
import { KnownExtensionIds } from "../../extensions/kinds/ExtPointKind.js"

import { WireTypeMessageModuleTypes } from "../di/Types.js"

import { IWireCodecAdapterFactory } from "../interface/IWireCodecAdapterFactory.js"
import {
   IAdapterCollection,
   IExtensionCollection,
   IExtensionMatchmaker,
} from "../../extensions/interface/index.js"
import { ITypeMapExtensionPoint, WireForm } from "../interface/index.js"

const DUMMY: IExtensionCollection<TYPE_MAP_EXTENSION_POINT> &
   IAdapterCollection<TYPE_MAP_EXTENSION_POINT, TYPE_MAP_ADAPTER_ID> =
   {} as unknown as any

@Injectable()
export class WireTxExtensionPoint implements ITypeMapExtensionPoint {
   constructor(
      @Inject(WireTypeMessageModuleTypes.TypeMapExtensionMatchmaker)
      readonly matchMaker: IExtensionMatchmaker<TYPE_MAP_EXTENSION_POINT>,
      @Inject(WireTypeMessageModuleTypes.TypeMapAdapterFactory)
      readonly adapterFactory: IWireCodecAdapterFactory,
   ) {
      matchMaker.registerExtensionPoint(this)
      matchMaker.registerAdapterFactory(
         TYPE_MAP_ADAPTER_ID_STRING,
         adapterFactory,
      )
   }

   encodeObject<T extends object>(
      sourceObject: T,
      extensionId: KnownExtensionIds<TYPE_MAP_EXTENSION_POINT>,
   ): WireForm<T, typeof extensionId> {
      const extension = this.extensions.get(extensionId)
      const adapter = this.adapters.adapt(extensionId, extension)
      return adapter.encodeObject(sourceObject)
   }

   decodeWireObject<T extends object>(
      transformedObject: WireForm<T, typeof extensionId>,
      extensionId: KnownExtensionIds<TYPE_MAP_EXTENSION_POINT>,
   ): T {
      const extension = this.extensions.get(extensionId)
      const adapter = this.adapters.adapt(extensionId, extension)
      return adapter.decodeWireObject(transformedObject)
   }

   private extensions: IExtensionCollection<TYPE_MAP_EXTENSION_POINT> = DUMMY

   private adapters: IAdapterCollection<
      TYPE_MAP_EXTENSION_POINT,
      TYPE_MAP_ADAPTER_ID
   > = DUMMY

   receiveExtensions(
      extensions: IExtensionCollection<TYPE_MAP_EXTENSION_POINT>,
      adapters: {
         readonly [TYPE_MAP_ADAPTER_ID_STRING]: IAdapterCollection<
            TYPE_MAP_EXTENSION_POINT,
            TYPE_MAP_ADAPTER_ID
         >
      },
   ): void {
      this.extensions = extensions
      this.adapters = adapters[TYPE_MAP_ADAPTER_ID_STRING]
   }
}
