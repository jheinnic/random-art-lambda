import {
   KnownExtensionClassIds,
   ExtensionClassKind,
   PayloadTypeKind,
   TArgsKind,
   KnownTArgsIds,
   KnownPayloadIds,
} from "../kinds/ExtensionClassKind.js"
import { IExtensionCollection } from "../interface/IExtensionCollection.js"
import { objectKeys } from "simplytyped"
import "../kinds/Examples.js"

export class ExtensionCollection<ExtensionPoint extends string = "Example">
   implements IExtensionCollection<ExtensionPoint>
{
   private readonly classMap: {
      [ExtensionId in KnownExtensionClassIds<ExtensionPoint>]: ExtensionClassKind<
         ExtensionPoint,
         ExtensionId
      >
   }

   private readonly argsMap: {
      [ExtensionId in KnownTArgsIds<ExtensionPoint>]: TArgsKind<
         ExtensionPoint,
         ExtensionId
      >
   }

   private readonly extensionMap: {
      [ExtensionId in KnownPayloadIds<ExtensionPoint>]: PayloadTypeKind<
         ExtensionPoint,
         ExtensionId
      >
   }

   constructor() {
      this.extensionMap = {}
      this.classMap = {}
      this.argsMap = {}
   }

   setClass(
      extensionId: KnownExtensionClassIds<ExtensionPoint>,
      extensionClass: ExtensionClassKind<ExtensionPoint, typeof extensionId>,
      ...args: TArgsKind<ExtensionPoint, typeof extensionId>
   ): void {
      this.classMap[extensionId] = extensionClass
      this.argsMap[extensionId] = args
   }

   // set<
   //    ExtensionId extends KnownPayloadIds<ExtensionPoint> & KnownTArgsIds<ExtensionPoint>,
   //    ExtensionClass extends IExtensionClass<ExtensionPoint, ExtensionId>,
   // >(
   //    extensionId: ExtensionId,
   //    extensionClass: ExtensionClass,
   //    value: InstanceType<ExtensionClass>,
   // ): void {
   //    if (!extensionClass[Symbol.hasInstance](value)) {
   //       throw new Error(`Value is not of type ${extensionClass.name}`)
   //    }
   //    this.extensionMap[extensionId] = value
   // }

   getClass(
      extensionId: KnownExtensionClassIds<ExtensionPoint>,
   ): ExtensionClassKind<ExtensionPoint, typeof extensionId> {
      let retVal: ExtensionClassKind<ExtensionPoint, typeof extensionId>
      if (extensionId in this.classMap) {
         retVal = this.classMap[extensionId]
      } else {
         // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
         throw new Error(`No class for ${extensionId} has been registered...`)
      }

      return retVal
   }

   get(
      extensionId: KnownExtensionClassIds<ExtensionPoint>,
   ): PayloadTypeKind<ExtensionPoint, typeof extensionId> {
      let retVal: PayloadTypeKind<ExtensionPoint, typeof extensionId>
      if (extensionId in this.extensionMap) {
         retVal = this.extensionMap[extensionId]
      } else if (extensionId in this.classMap && extensionId in this.argsMap) {
         const tArgs: TArgsKind<ExtensionPoint, typeof extensionId> =
            this.argsMap[extensionId]
         const ExtensionClass: ExtensionClassKind<
            ExtensionPoint,
            typeof extensionId
         > = this.classMap[extensionId]
         retVal = new ExtensionClass(...tArgs)
         this.extensionMap[extensionId] = retVal
      } else {
         // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
         throw new Error(`No extension registered for <${extensionId}>`)
      }

      return retVal
   }

   get classKeys(): Array<KnownExtensionClassIds<ExtensionPoint>> {
      return objectKeys(this.classMap)
   }

   get keys(): Array<KnownExtensionClassIds<ExtensionPoint>> {
      return objectKeys(this.extensionMap)
   }
}
