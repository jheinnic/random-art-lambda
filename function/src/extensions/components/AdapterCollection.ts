import "../kinds/Examples.js"
import {
   KnownPayloadIds,
   KnownExtensionClassIds,
   PayloadTypeKind,
   ExtensionClassKind,
} from "../kinds/ExtensionClassKind.js"
import {
   ExtensionAdapterKind,
   KnownExtensionAdapterIds,
} from "../kinds/ExtensionAdapterKind.js"
import { IAdapterFactory } from "../interface/IAdapterFactory.js"
import { IAdapterCollection } from "../interface/IAdapterCollection.js"

export class AdapterCollection<
   ExtensionPoint extends string,
   AdapterId extends KnownExtensionAdapterIds<ExtensionPoint>,
> implements IAdapterCollection<ExtensionPoint, AdapterId>
{
   private readonly adapterMap: {
      [ExtensionId in KnownPayloadIds<ExtensionPoint>]: ExtensionAdapterKind<
         ExtensionPoint,
         AdapterId,
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

   fromFactory(): IAdapterFactory<ExtensionPoint, AdapterId> {
      return this.adapterFactory
   }

   adapt(
      extensionId: KnownExtensionClassIds<ExtensionPoint>,
      extensionClass: ExtensionClassKind<ExtensionPoint, typeof extensionId>,
      extension: PayloadTypeKind<ExtensionPoint, typeof extensionId>,
   ): ExtensionAdapterKind<ExtensionPoint, AdapterId, typeof extensionId> {
      if (
         extension === undefined ||
         extensionClass === undefined ||
         extension === null ||
         extensionClass === null
      ) {
         throw new Error(`Class or extension is undefined or null`)
      }
      if (!extensionClass[Symbol.hasInstance](extension)) {
         throw new Error(
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/dot-notation
            `Extension object for extension ${extensionId} is not an object of type ${extensionClass.name}, but rather ${extension["constructor"]["name"]}`,
         )
      }
      let retVal: ExtensionAdapterKind<
         ExtensionPoint,
         AdapterId,
         typeof extensionId
      >
      if (extensionId in this.adapterMap) {
         retVal = this.adapterMap[extensionId]
      } else {
         retVal = this.adapterFactory.adapt(extensionId, extension)
         if (retVal === undefined) {
            throw new Error(
               // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
               `Adapter factory failed to adapt extension for ${extensionId} of type ${extensionClass.name}`,
            )
         }
         this.adapterMap[extensionId] = retVal
      }

      return retVal
   }

   unadapt(extensionId: KnownExtensionClassIds<ExtensionPoint>): void {
      if (extensionId in this.adapterMap) {
         // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
         delete this.adapterMap[extensionId]
      }
   }
}
