import { OnModuleInit, Type } from "@nestjs/common"
import { IAdapterFactory } from "../interface/IAdapterFactory.js"
import { IExtension, IExtensionClass } from "../interface/IExtension.js"
import { IExtensionCollection } from "../interface/IExtensionCollection.js"
import { IExtensionPoint } from "../interface/IExtensionPoint.js"
import { IExtensionWrangler } from "../interface/IExtensionWrangler.js"
import { ExtensionCollection } from "./ExtensionCollection.js"
import { IAdapterCollection } from "../interface/IAdapterCollection.js"
import { AdapterCollection } from "./AdapterCollection.js"

export class ExtensionWrangler<
      ExtensionPoint extends string,
      PayloadType extends string,
      TArgs extends any[],
   >
   implements
      IExtensionWrangler<ExtensionPoint, PayloadType, TArgs>,
      OnModuleInit
{
   // extensionKeys: string[]

   registeredExtensions: IExtensionCollection<
      ExtensionPoint,
      PayloadType,
      TArgs
   >

   extensionPoints: Array<IExtensionPoint<ExtensionPoint, PayloadType, TArgs>>

   adapterFactories: IAdapterCollection<ExtensionPoint, PayloadType, TArgs>

   registrationPhase: boolean

   constructor() {
      this.registeredExtensions = new ExtensionCollection()
      this.adapterFactories = new AdapterCollection()
      this.extensionPoints = []
      this.registrationPhase = true
   }

   registerExtension<ExtensionId extends string>(
      extensionKey: ExtensionId,
      extensionClass: IExtensionClass<
         ExtensionPoint,
         ExtensionId,
         PayloadType,
         TArgs
      >,
   ): void {
      if (extensionKey in this.registeredExtensions) {
         throw new Error(
            "There is already an extension registered as " + extensionKey,
         )
      }
      if (!this.registrationPhase) {
         throw new Error("Registration must happen during Nest's DI stage...")
      }
      this.registeredExtensions.setClass(extensionKey, extensionClass)
   }

   registerExtensionPoint(
      extensionPoint: IExtensionPoint<ExtensionPoint, PayloadType, TArgs>,
   ): void {
      if (!this.registrationPhase) {
         throw new Error("Registration must happen during Nest's DI stage...")
      }

      this.extensionPoints.push(extensionPoint)
   }

   registerAdapterFactory<Adapter extends object>(
      factory: IAdapterFactory<ExtensionPoint, PayloadType, TArgs, Adapter>,
   ): void {
      this.adapterFactories.addFactory(factory)
   }

   onModuleInit(): void {
      if (!this.registrationPhase) {
         throw new Error(
            "Module initialization only happens once in a process' lifetime",
         )
      }

      this.extensionPoints.forEach(
         (x: IExtensionPoint<ExtensionPoint, PayloadType, TArgs>) => {
            x.receiveExtensions(
               this.registeredExtensions,
               this.adapterFactories,
            )
         },
      )
      // this.adapterFactories.forEach(
      //    (
      //       x: [
      //          IExtensionPoint<ExtensionPoint, ExtensionApi>,
      //          IAdapterFactory<ExtensionPoint, ExtensionApi, any>,
      //       ],
      //    ) => {
      //       x[0].receiveAdapters(
      //          x[1],
      //          Object.values(this.registeredExtensions).map(
      //             // <E extends IExtension<ExtensionPoint, string>>(
      //             //    ext: [KeyFor<E>, E],
      //             // ) => {
      //             (ext: [string, IExtension<ExtensionPoint>]): any => {
      //                return x[1].adapt(this.extensionPoint, ext[1])
      //             },
      //          ),
      //       )
      //    },
      // )

      // this.registeredExtensions = new ExtensionCollection()
      // this.adapterFactories = new AdapterCollection()
      this.registrationPhase = false
      this.extensionPoints = []
   }
}
