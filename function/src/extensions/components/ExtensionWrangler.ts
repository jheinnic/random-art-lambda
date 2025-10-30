import { OnModuleInit } from "@nestjs/common"
import {
   ExtensionClassKind,
   KnownExtensionIds,
   KnownExtensionPointIds,
} from "../kinds/ExtensionKind.js"
import { KnownExtensionAdapterIds } from "../kinds/ExtensionAdapterKind.js"

import { IExtensionCollection } from "../interface/IExtensionCollection.js"
import { IExtensionWrangler } from "../interface/IExtensionWrangler.js"
import { IExtensionPoint } from "../interface/IExtensionPoint.js"
import { IAdapterCollection } from "../interface/IAdapterCollection.js"
import { IAdapterFactory } from "../interface/IAdapterFactory.js"
import { ExtensionCollection } from "./ExtensionCollection.js"
import { AdapterCollection } from "./AdapterCollection.js"

export class ExtensionWrangler<ExtensionPoint extends KnownExtensionPointIds>
   implements IExtensionWrangler<ExtensionPoint>, OnModuleInit
{
   // extensionKeys: string[]

   registeredExtensions: IExtensionCollection<ExtensionPoint>

   extensionPoints: Array<IExtensionPoint<ExtensionPoint>>

   adapterFactories: {
      [AdapterId in KnownExtensionAdapterIds<ExtensionPoint>]?: IAdapterCollection<
         ExtensionPoint,
         AdapterId
      >
   }

   registrationPhase: boolean

   constructor() {
      this.registeredExtensions = new ExtensionCollection<ExtensionPoint>()
      this.adapterFactories = {}
      this.extensionPoints = []
      this.registrationPhase = true
   }

   registerExtension(
      extensionKey: KnownExtensionIds<ExtensionPoint>,
      extensionClass: ExtensionClassKind<ExtensionPoint, typeof extensionKey>,
      args: ConstructorParameters<
         ExtensionClassKind<ExtensionPoint, typeof extensionKey>
      >,
   ): void {
      if (extensionKey in this.registeredExtensions) {
         throw new Error(
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            `There is already an extension registered as ${extensionKey}`,
         )
      }
      if (!this.registrationPhase) {
         throw new Error("Registration must happen during Nest's DI stage...")
      }
      this.registeredExtensions.setClass(extensionKey, extensionClass, ...args)
   }

   registerExtensionPoint(
      extensionPoint: IExtensionPoint<ExtensionPoint>,
   ): void {
      if (!this.registrationPhase) {
         throw new Error("Registration must happen during Nest's DI stage...")
      }

      this.extensionPoints.push(extensionPoint)
   }

   registerAdapterFactory<
      AdapterId extends KnownExtensionAdapterIds<ExtensionPoint>,
   >(
      adapterId: AdapterId,
      factory: IAdapterFactory<ExtensionPoint, AdapterId>,
   ): void {
      if (!this.registrationPhase) {
         throw new Error("Registration must happen during Nest's DI stage...")
      }

      this.adapterFactories[adapterId] = new AdapterCollection(factory)
   }

   onModuleInit(): void {
      if (!this.registrationPhase) {
         throw new Error(
            "Module initialization only happens once in a process' lifetime",
         )
      }

      this.extensionPoints.forEach((x: IExtensionPoint<ExtensionPoint>) => {
         x.receiveExtensions(this.registeredExtensions, {
            ...this.adapterFactories,
         })
      })

      this.registrationPhase = false
      this.extensionPoints = []
      this.adapterFactories = {}
   }
}
