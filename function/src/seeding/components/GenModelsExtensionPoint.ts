import { IAdapterFactory } from "../../extensions/interface/IAdapterFactory.js"
import { IExtensionAdapterClass } from "../../extensions/interface/IExtensionAdapterClass.js"
import { IExtensionCollection } from "../../extensions/interface/IExtensionCollection.js"
import { IExtensionPoint } from "../../extensions/interface/IExtensionPoint.js"
import { GEN_MODEL_SEED_TYPE_EXTENSION_POINT } from "./../interface/SeedTypeExtensionPoint"
export class GenModelSeedExtensionPoint
   implements IExtensionPoint<GEN_MODEL_SEED_TYPE_EXTENSION_POINT>
{
   receiveExtensions<Extension extends string>(
      extensions: IExtensionCollection<string, Extension>,
      idsPresent: Extension[],
   ): void {}

   receiveAdapters<Adapter extends IExtensionAdapterClass<string>>(
      adapterFactory: IAdapterFactory<string, Adapter>,
      adapters: Adapter[],
   ): void {}
}
