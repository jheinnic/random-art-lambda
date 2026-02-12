import { OnModuleInit } from "@nestjs/common"
import {
   ExtensionClassKind,
   ExtensionTArgsKind,
   KnownExtensionIds,
   KnownExtensionPointIds,
} from "../kinds/ExtPointKind.js"
import { KnownExtensionAdapterIds } from "../kinds/ExtAdapterKind.js"

import { IExtensionCollection } from "../interface/IExtensionCollection.js"
import { IExtensionWrangler } from "../interface/IExtensionWrangler.js"
import { IExtensionPoint } from "../interface/IExtensionPoint.js"
import { IAdapterCollection } from "../interface/IAdapterCollection.js"
import { IAdapterFactory } from "../interface/IAdapterFactory.js"

import { ExtensionCollection } from "./ExtensionCollection.js"
import { AdapterCollection } from "./AdapterCollection.js"

export class ExtensionWrangler<
      ExtensionPoint extends KnownExtensionPointIds,
      AdapterIds extends ReadonlyArray<
         KnownExtensionAdapterIds<ExtensionPoint>
      >,
   >
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

   pendingFactories: Set<KnownExtensionAdapterIds<ExtensionPoint>>

   registrationPhase: boolean

   constructor(
      readonly adapterIds: IsCompleteKeyTuple<
         AdapterIds,
         KnownExtensionAdapterIds<ExtensionPoint>
      >,
   ) {
      this.registeredExtensions = new ExtensionCollection<ExtensionPoint>()
      this.adapterFactories = {}
      this.extensionPoints = []
      this.registrationPhase = true
      this.pendingFactories = new Set(adapterIds)
   }

   registerExtension(
      extensionKey: KnownExtensionIds<ExtensionPoint>,
      extensionClass: ExtensionClassKind<ExtensionPoint, typeof extensionKey>,
      args: ExtensionTArgsKind<ExtensionPoint, typeof extensionKey>,
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
      this.pendingFactories.delete(adapterId)
   }

   onModuleInit(): void {
      if (!this.registrationPhase) {
         throw new Error(
            "Module initialization only happens once in a process' lifetime",
         )
      }

      if (this.pendingFactories.size > 0) {
         throw new Error(
            `Missing adapter factory for keys: ${JSON.stringify(this.pendingFactories)}`,
         )
      }

      const readyAdapters: {
         [AdapterId in KnownExtensionAdapterIds<ExtensionPoint>]: IAdapterCollection<
            ExtensionPoint,
            AdapterId
         >
      } = this.adapterFactories as {
         [AdapterId in KnownExtensionAdapterIds<ExtensionPoint>]: IAdapterCollection<
            ExtensionPoint,
            AdapterId
         >
      }

      this.extensionPoints.forEach((x: IExtensionPoint<ExtensionPoint>) => {
         x.receiveExtensions(this.registeredExtensions, readyAdapters)
      })

      this.registrationPhase = false
      this.extensionPoints = []
      this.adapterFactories = {}
   }
}

type HasDuplicates<
   T extends readonly unknown[],
   Seen extends readonly unknown[] = [],
> = T extends readonly [infer Head, ...infer Tail]
   ? Head extends Seen[number]
      ? true // Found duplicate
      : HasDuplicates<Tail, [...Seen, Head]>
   : false

// Helper: Convert tuple to union
type TupleToUnion<T extends readonly unknown[]> = T[number]

// Helper: Check if two unions have the same members (bidirectional subset check)
type SameUnion<A, B> = [A] extends [B]
   ? [B] extends [A]
      ? true
      : false
   : false

/**
 * Main validation type - returns the input tuple if valid, never if invalid
 */
type IsCompleteKeyTuple<T extends readonly string[], Keys extends string> =
   // Check for duplicates
   HasDuplicates<T> extends true
      ? never
      : // Check if tuple union matches object keys union
        SameUnion<TupleToUnion<T>, Keys> extends true
        ? T
        : never
