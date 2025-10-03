import { Type } from "@nestjs/common"
import { IExtension, IExtensionClass } from "../interface/IExtension.js"
import { IExtensionCollection } from "../interface/IExtensionCollection.js"
import { IAdapterFactory } from "../interface/IAdapterFactory.js"
import { IAdapterCollection } from "../interface/IAdapterCollection.js"

export class AdapterCollection<
   ExtensionPoint extends string,
   PayloadType extends IExtension,
   TArgs extends any[],
> implements IAdapterCollection<ExtensionPoint, PayloadType, TArgs>
{
   private readonly adapterMap: Map<
      IAdapterFactory<ExtensionPoint, PayloadType, TArgs, object>,
      Map<string, any>
   >

   constructor() {
      this.adapterMap = new Map()
   }

   addFactory<Adapter extends object>(
      factory: IAdapterFactory<ExtensionPoint, PayloadType, TArgs, Adapter>,
   ): void {
      if (this.adapterMap.has(factory)) {
         return
      }
      this.adapterMap.set(factory, new Map())
   }

   adaptWith<
      ExtensionId extends string,
      ExtensionClass extends IExtensionClass<
         ExtensionPoint,
         ExtensionId,
         PayloadType,
         TArgs
      >,
      Adapter extends object,
      AdapterFactory extends IAdapterFactory<
         ExtensionPoint,
         PayloadType,
         TArgs,
         Adapter
      >,
   >(
      key: ExtensionId,
      _clazz: ExtensionClass,
      extension: InstanceType<ExtensionClass>,
      factory: AdapterFactory,
   ): Adapter | undefined {
      const adapterState = this.adapterMap.get(factory)
      if (adapterState === undefined) {
         return undefined
      }
      let retVal = adapterState.get(key)
      if (retVal === undefined) {
         if (extension === undefined) {
            return undefined
         }
         retVal = factory.adapt(key, _clazz, extension)
         if (retVal === undefined) {
            return undefined
         }
         adapterState.set(key, retVal)
      }
      return retVal as Adapter
   }

   unadapt<
      ExtensionId extends string,
      ExtensionClass extends IExtensionClass<
         ExtensionPoint,
         ExtensionId,
         PayloadType,
         TArgs
      >,
      Adapter extends object,
      AdapterFactory extends IAdapterFactory<
         ExtensionPoint,
         PayloadType,
         TArgs,
         Adapter
      >,
   >(
      key: ExtensionId,
      _clazz: ExtensionClass,
      extension: InstanceType<ExtensionClass>,
      factory: AdapterFactory,
      adapter: Adapter,
   ): void {
      const adapterState = this.adapterMap.get(factory)
      if (adapterState === undefined) {
         return
      }
      if (!adapterState.has(key)) {
         return
      }
      adapterState.delete(key)
   }

   // adapters(): AdapterClasses {
   //    return [...this.adapterMap.keys()] as AdapterClasses
   // }
   adapterFactories(): Array<
      [IAdapterFactory<ExtensionPoint, PayloadType, TArgs, object>, object]
   > {
      return []
   }
}
