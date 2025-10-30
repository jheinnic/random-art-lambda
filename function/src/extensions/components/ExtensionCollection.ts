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

   setClass(
      extensionId: KnownExtensionIds<ExtensionPoint>,
      extensionClass: ExtensionClassKind<ExtensionPoint, typeof extensionId>,
      ...args: ExtensionTArgsKind<ExtensionPoint, typeof extensionId>
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

   getClass(
      extensionId: KnownExtensionIds<ExtensionPoint>,
   ): ExtensionClassKind<ExtensionPoint, typeof extensionId> {
      if (
         !(extensionId in this.classMap) ||
         this.classMap[extensionId] === undefined
      ) {
         // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
         throw new Error(`No class for ${extensionId} has been registered...`)
      }

      return this.classMap[extensionId]
   }

   get(
      extensionId: KnownExtensionIds<ExtensionPoint>,
   ): ExtensionPayloadKind<ExtensionPoint, typeof extensionId> {
      if (
         !(extensionId in this.extensionMap) ||
         this.extensionMap[extensionId] === undefined
      ) {
         if (
            extensionId in this.classMap &&
            this.classMap[extensionId] !== undefined &&
            extensionId in this.argsMap &&
            this.argsMap[extensionId] !== undefined
         ) {
            const tArgs = this.argsMap[extensionId]
            const ExtensionClassKind: ExtensionClassKind<
               ExtensionPoint,
               typeof extensionId
            > = this.classMap[extensionId]
            return (this.extensionMap[extensionId] = new ExtensionClassKind(
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
