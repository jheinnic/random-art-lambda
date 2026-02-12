import { objectKeys } from "simplytyped"

import "../kinds/Examples.js"
import {
   ExtensionClassKind,
   ExtensionPayloadKind,
   ExtensionTArgsKind,
   KnownExtensionIds,
   KnownExtensionPointIds,
} from "../kinds/index.js"
import { IExtensionCollection } from "../interface/IExtensionCollection.js"

export class ExtensionCollection<ExtensionPoint extends KnownExtensionPointIds>
   implements IExtensionCollection<ExtensionPoint>
{
   private readonly classMap: {
      [ExtensionId in KnownExtensionIds<ExtensionPoint>]?: ExtensionClassKind<
         ExtensionPoint,
         ExtensionId
      >
   }

   private readonly argsMap: {
      [ExtensionId in KnownExtensionIds<ExtensionPoint>]?: ExtensionTArgsKind<
         ExtensionPoint,
         ExtensionId
      >
   }

   private readonly extensionMap: {
      [ExtensionId in KnownExtensionIds<ExtensionPoint>]?: ExtensionPayloadKind<
         ExtensionPoint,
         ExtensionId
      >
   }

   constructor() {
      this.extensionMap = {}
      this.classMap = {}
      this.argsMap = {}
   }

   setClass<ExtensionId extends KnownExtensionIds<ExtensionPoint>>(
      extensionId: ExtensionId,
      extensionClass: ExtensionClassKind<ExtensionPoint, ExtensionId>,
      ...args: ExtensionTArgsKind<ExtensionPoint, ExtensionId>
   ): void {
      this.classMap[extensionId] = extensionClass
      this.argsMap[extensionId] = args
   }

   // set<
   //    ExtensionId extends KnownExtensionIds<ExtensionPoint> & KnownExtensionIds<ExtensionPoint>,
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

   getClass<ExtensionId extends KnownExtensionIds<ExtensionPoint>>(
      extensionId: ExtensionId,
   ): ExtensionClassKind<ExtensionPoint, ExtensionId> {
      if (
         !(extensionId in this.classMap) ||
         this.classMap[extensionId] === undefined
      ) {
         // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
         throw new Error(`No class for ${extensionId} has been registered...`)
      }

      return this.classMap[extensionId]
   }

   get<ExtensionId extends KnownExtensionIds<ExtensionPoint>>(
      extensionId: ExtensionId,
   ): ExtensionPayloadKind<ExtensionPoint, ExtensionId> {
      if (
         !(extensionId in this.extensionMap) ||
         this.extensionMap[extensionId] === undefined ||
         this.extensionMap[extensionId] === null
      ) {
         const tArgs:
            | ExtensionTArgsKind<ExtensionPoint, ExtensionId>
            | undefined = this.argsMap[extensionId]
         const ExtensionClass:
            | ExtensionClassKind<ExtensionPoint, ExtensionId>
            | undefined = this.classMap[extensionId]
         if (
            tArgs !== undefined &&
            tArgs !== null &&
            ExtensionClass !== undefined &&
            ExtensionClass !== null
         ) {
            return (this.extensionMap[extensionId] = new ExtensionClass(
               ...tArgs,
            ))
         }

         // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
         throw new Error(`No extension registered for <${extensionId}>`)
      }

      return this.extensionMap[extensionId]
   }

   get classKeys(): Array<KnownExtensionIds<ExtensionPoint>> {
      return objectKeys(this.classMap)
   }

   get keys(): Array<KnownExtensionIds<ExtensionPoint>> {
      return objectKeys(this.extensionMap)
   }
}
