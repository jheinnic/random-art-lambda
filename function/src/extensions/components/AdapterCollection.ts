import "../kinds/Examples.js"
import {
   KnownExtensionIds,
   ExtensionClassKind,
   ExtensionPayloadKind,
} from "../kinds/ExtensionKind.js"
import {
   ExtensionAdapterKind,
   KnownExtensionAdapterIds,
} from "../kinds/ExtensionAdapterKind.js"
import { IAdapterFactory } from "../interface/IAdapterFactory.js"
import { IAdapterCollection } from "../interface/IAdapterCollection.js"
import { KnownExtensionPointIds } from "../kinds/ExtensionPointKind.js"

export class AdapterCollection<
   ExtensionPoint extends KnownExtensionPointIds,
   AdapterId extends KnownExtensionAdapterIds<ExtensionPoint>,
> implements IAdapterCollection<ExtensionPoint, AdapterId>
{
   private readonly adapterMap: {
      [ExtensionId in KnownExtensionIds<ExtensionPoint>]?: ExtensionAdapterKind<
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
      extensionId: KnownExtensionIds<ExtensionPoint>,
      extension: ExtensionPayloadKind<ExtensionPoint, typeof extensionId>,
   ): ExtensionAdapterKind<ExtensionPoint, AdapterId, typeof extensionId> {
      if (extension === undefined || extension === null) {
         throw new Error(`extension cannot be undefined or null`)
      }
      if (
         !(extensionId in this.adapterMap) ||
         this.adapterMap[extensionId] === undefined
      ) {
         const retVal = this.adapterFactory.adapt(extensionId, extension)
         if (retVal === undefined) {
            throw new Error(
               // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
               `Adapter factory failed to adapt extension for ${extensionId} of type ${this.adapterFactory.adapterId}`,
            )
         }
         this.adapterMap[extensionId] = retVal
         return retVal
      }

      return this.adapterMap[extensionId]
   }

   unadapt(extensionId: KnownExtensionIds<ExtensionPoint>): void {
      if (extensionId in this.adapterMap) {
         // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
         delete this.adapterMap[extensionId]
      }
   }
}
