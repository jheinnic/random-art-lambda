import { OnModuleInit } from "@nestjs/common"
import { IAdapterFactory } from "../interface/IAdapterFactory.js"
import { IExtension } from "../interface/IExtension.js"
import { IExtensionCollection } from "../interface/IExtensionCollection.js"
import { IExtensionPoint } from "../interface/IExtensionPoint.js"
import { IExtensionWrangler } from "../interface/IExtensionWrangler.js"
import { IExtensionAdapterClass } from "../interface/IExtensionAdapterClass.js"

export class ExtensionWrangler<
      ExtensionPoint extends string,
      ExtensionApi extends {},
   >
   implements IExtensionWrangler<ExtensionPoint, ExtensionApi>, OnModuleInit
{
   extensionKeys: string[]

   registeredExtensions: IExtensionCollection<ExtensionPoint, ExtensionApi>

   extensionPoints: Array<IExtensionPoint<ExtensionPoint, ExtensionApi>>

   adapterFactories: Array<
      [
         IExtensionPoint<ExtensionPoint, ExtensionApi>,
         IAdapterFactory<ExtensionPoint, ExtensionApi, any>,
      ]
   >

   registrationPhase: boolean

   constructor() {
      this.extensionKeys = []
      this.registeredExtensions = {}
      this.extensionPoints = []
      this.adapterFactories = []
      this.registrationPhase = true
   }

   registerExtension<ExtensionId extends string>(
      extensionKey: ExtensionId,
      extension: ExtensionApi & IExtension<ExtensionPoint, ExtensionId>,
   ): void {
      if (extensionKey in this.registeredExtensions) {
         throw new Error(
            "There is already an extension registered as " + extensionKey,
         )
      }
      if (!this.registrationPhase) {
         throw new Error("Registration must happen during Nest's DI stage...")
      }
      this.registeredExtensions[extensionKey] = [extensionKey, extension]
      this.extensionKeys.push(extensionKey)
   }

   registerExtensionPoint(
      extensionPoint: IExtensionPoint<ExtensionPoint, ExtensionApi>,
   ): void {
      if (!this.registrationPhase) {
         throw new Error("Registration must happen during Nest's DI stage...")
      }

      this.extensionPoints.push(extensionPoint)
   }

   registerForAdapters<
      Adapter extends IExtensionAdapterClass<ExtensionPoint, ExtensionApi>,
   >(
      extensionPoint: IExtensionPoint<ExtensionPoint, ExtensionApi>,
      adapterFactory: IAdapterFactory<ExtensionPoint, ExtensionApi, Adapter>,
   ): void {
      if (!this.registrationPhase) {
         throw new Error("Registration must happen during Nest's DI stage...")
      }

      this.adapterFactories.push([extensionPoint, adapterFactory])
   }

   onModuleInit(): void {
      if (!this.registrationPhase) {
         throw new Error(
            "Module initialization only happens once in a process' lifetime",
         )
      }

      this.extensionPoints.forEach(
         (x: IExtensionPoint<ExtensionPoint, ExtensionApi>) => {
            x.receiveExtensions(this.registeredExtensions, this.extensionKeys)
         },
      )
      this.adapterFactories.forEach(
         (
            x: [
               IExtensionPoint<ExtensionPoint, ExtensionApi>,
               IAdapterFactory<ExtensionPoint, ExtensionApi, any>,
            ],
         ) => {
            x[0].receiveAdapters(
               x[1],
               Object.values(this.registeredExtensions).map(
                  // <E extends IExtension<ExtensionPoint, string>>(
                  //    ext: [KeyFor<E>, E],
                  // ) => {
                  (ext: [string, IExtension<ExtensionPoint>]): any => {
                     return x[1].adapt(x[0], ext[1])
                  },
               ),
            )
         },
      )

      this.registrationPhase = false
      this.extensionKeys = []
      this.registeredExtensions = {}
      this.extensionPoints = []
      this.adapterFactories = []
   }
}

type KeyFor<T> =
   T extends IExtension<infer ExtensionPoint, string> ? ExtensionPoint : never
