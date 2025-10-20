import { IExtensionClass } from "../interface/IExtension.js"
import { IAdapterFactory } from "../interface/IAdapterFactory.js"
import { IAdapterCollection } from "../interface/IAdapterCollection.js"
import {
   ExtensionAdapterKind,
   ExtensionAdapterURIFromParts,
} from "../interface/IExtensionAdapter.js"
import { NamespaceURI } from "../interface/IExtensionPoint.js"

export class AdapterCollection<
   ExtensionPoint extends string,
   AdapterId extends string,
> implements IAdapterCollection<ExtensionPoint, AdapterId>
{
   private readonly adapterMap: {
      [ExtensionId in string]: ExtensionAdapterKind<
         ExtensionAdapterURIFromParts<ExtensionPoint, AdapterId>,
         ExtensionId
      >
   }

   constructor(
      private readonly adapterFactory: IAdapterFactory<
         ExtensionPoint,
         AdapterId
      >,
   ) {
      this.adapterMap = {}
   }

   get adapterId(): NamespaceURI<ExtensionPoint, AdapterId> {
      return this.adapterFactory.URI
   }

   fromFactory(): IAdapterFactory<ExtensionPoint, AdapterId> {
      return this.adapterFactory
   }

   adapt<
      ExtensionId extends KnownExtensionIds<ExtensionPoint>,
      ExtensionClass extends IExtensionClass<ExtensionPoint, ExtensionId>,
   >(
      key: ExtensionId,
      clazz: ExtensionClass,
      extension: InstanceType<ExtensionClass>,
   ): ExtensionAdapterKind<
      ExtensionAdapterURIFromParts<ExtensionPoint, AdapterId>,
      ExtensionId
   > {
      if (
         extension === undefined ||
         clazz === undefined ||
         extension === null ||
         clazz === null
      ) {
         throw new Error(`Class or extension is undefined or null`)
      }
      if (!clazz[Symbol.hasInstance](extension)) {
         throw new Error(
            `Extension object for extension ${key} is not an object of type ${clazz.name}, but rather ${extension.constructor.name}`,
         )
      }
      let retVal: ExtensionAdapterKind<
         ExtensionAdapterURIFromParts<ExtensionPoint, AdapterId>,
         ExtensionId
      >
      if (key in this.adapterMap) {
         retVal = this.adapterMap[key]
      } else {
         retVal = this.adapterFactory.adapt(key, clazz, extension)
         if (retVal === undefined) {
            throw new Error(
               `Adapter factory failed to adapt extension for ${key} of type ${clazz.name}`,
            )
         }
         this.adapterMap[key] = retVal
      }

      return retVal
   }

   unadapt<
      ExtensionId extends KnownExtensionIds<ExtensionPoint>,
      ExtensionClass extends IExtensionClass<ExtensionPoint, ExtensionId>,
   >(
      key: ExtensionId,
      clazz: ExtensionClass,
      extension: InstanceType<ExtensionClass>,
   ): void {
      if (
         extension === undefined ||
         clazz === undefined ||
         extension === null ||
         clazz === null
      ) {
         throw new Error(`Class or extension is undefined or null`)
      }
      if (!clazz[Symbol.hasInstance](extension)) {
         throw new Error(
            `Extension object for extension ${key} is not an object of type ${clazz.name}, but rather ${extension.constructor.name}`,
         )
      }
      if (key in this.adapterMap) {
         delete this.adapterMap[key]
      }
   }
}
