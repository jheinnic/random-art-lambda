import { OnModuleInit, Type } from "@nestjs/common"
import { IAdapterFactory } from "../interface/IAdapterFactory.js"
import {
   IExtension,
   IExtensionClass,
   KnownTArgsIds,
   TArgsKind,
} from "../interface/IExtension.js"
import { IExtensionCollection } from "../interface/IExtensionCollection.js"
import { IExtensionPoint } from "../interface/IExtensionPoint.js"
import { IExtensionWrangler } from "../interface/IExtensionWrangler.js"
import { ExtensionCollection } from "./ExtensionCollection.js"
import { IAdapterCollection } from "../interface/IAdapterCollection.js"
import { AdapterCollection } from "./AdapterCollection.js"
import { KnownAdapterIds } from "../interface/IExtensionAdapter.js"

export class ExtensionWrangler<ExtensionPoint extends string>
   implements IExtensionWrangler<ExtensionPoint>, OnModuleInit
{
   // extensionKeys: string[]

   registeredExtensions: IExtensionCollection<ExtensionPoint>

   extensionPoints: Array<IExtensionPoint<ExtensionPoint>>

   adapterFactories: {
      [AdapterId in string]: IAdapterCollection<ExtensionPoint, AdapterId>
   }

   registrationPhase: boolean

   constructor() {
      this.registeredExtensions = new ExtensionCollection<ExtensionPoint>()
      this.adapterFactories = {}
      this.extensionPoints = []
      this.registrationPhase = true
   }

   registerExtension<ExtensionId extends KnownTArgsIds<ExtensionPoint>>(
      extensionKey: ExtensionId,
      extensionClass: IExtensionClass<ExtensionPoint, ExtensionId>,
      args: TArgsKind<ExtensionPoint, ExtensionId>,
   ): void {
      if (extensionKey in this.registeredExtensions) {
         throw new Error(
            "There is already an extension registered as " + extensionKey,
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

   registerAdapterFactory<AdapterId extends KnownAdapterIds<ExtensionPoint>>(
      adapterId: AdapterId,
      factory: IAdapterFactory<ExtensionPoint, AdapterId>,
   ): void {
      this.adapterFactories[adapterId] = new AdapterCollection(factory)
   }

   onModuleInit(): void {
      if (!this.registrationPhase) {
         throw new Error(
            "Module initialization only happens once in a process' lifetime",
         )
      }

      this.extensionPoints.forEach((x: IExtensionPoint<ExtensionPoint>) => {
         x.receiveExtensions(this.registeredExtensions, this.adapterFactories)
      })

      this.registrationPhase = false
      this.extensionPoints = []
   }
}
