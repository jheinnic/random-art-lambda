import {
   ExtensionPayloadTypeURIFromParts,
   ExtensionTArgsURIFromParts,
   IExtensionClass,
   PayloadTypeKind,
   TArgsKind,
} from "../interface/IExtension.js"
import { IExtensionCollection } from "../interface/IExtensionCollection.js"

export class ExtensionCollection<ExtensionPoint extends string>
   implements IExtensionCollection<ExtensionPoint>
{
   private readonly classMap: {
      [ExtensionId in string]: IExtensionClass<ExtensionPoint, ExtensionId>
   }

   private readonly argsMap: {
      [ExtensionId in string]: TArgsKind<
         ExtensionTArgsURIFromParts<ExtensionPoint, ExtensionId>
      >
   }

   private readonly extensionMap: {
      [ExtensionId in string]: PayloadTypeKind<
         ExtensionPayloadTypeURIFromParts<ExtensionPoint, ExtensionId>
      >
   }

   constructor() {
      this.extensionMap = {}
      this.classMap = {}
      this.argsMap = {}
   }

   setClass<
      ExtensionId extends KnownExtensionIds<ExtensionPoint>,
      ExtensionClass extends IExtensionClass<ExtensionPoint, ExtensionId>,
   >(
      key: ExtensionId,
      clazz: ExtensionClass,
      ...args: TArgsKind<
         ExtensionTArgsURIFromParts<ExtensionPoint, ExtensionId>
      >
   ): void {
      this.classMap[key] = clazz as unknown as IExtensionClass<
         ExtensionPoint,
         string
      >
      this.argsMap[key] = args
   }

   // set<
   //    ExtensionId extends KnownPayloadIds<ExtensionPoint> & KnownTArgsIds<ExtensionPoint>,
   //    ExtensionClass extends IExtensionClass<ExtensionPoint, ExtensionId>,
   // >(
   //    key: ExtensionId,
   //    clazz: ExtensionClass,
   //    value: InstanceType<ExtensionClass>,
   // ): void {
   //    if (!clazz[Symbol.hasInstance](value)) {
   //       throw new Error(`Value is not of type ${clazz.name}`)
   //    }
   //    this.extensionMap[key] = value
   // }

   getClass<
      ExtensionId extends KnownExtensionIds<ExtensionPoint>,
      ExtensionClass extends IExtensionClass<ExtensionPoint, ExtensionId>,
   >(key: ExtensionId): ExtensionClass | undefined {
      let retVal: ExtensionClass | undefined
      if (key in this.classMap) {
         retVal = this.classMap[key] as unknown as ExtensionClass
      }

      return retVal
   }

   get<
      ExtensionId extends KnownExtensionIds<ExtensionPoint>,
      ExtensionClass extends IExtensionClass<ExtensionPoint, ExtensionId>,
   >(
      key: ExtensionId,
      Clazz: ExtensionClass,
   ): InstanceType<ExtensionClass> | undefined {
      let retVal: InstanceType<ExtensionClass> | undefined
      if (key in this.extensionMap) {
         retVal = this.extensionMap[
            key
         ] as unknown as InstanceType<ExtensionClass>
      } else if (key in this.argsMap) {
         const tArgs = this.argsMap[key] as unknown as TArgsKind<
            ExtensionTArgsURIFromParts<ExtensionPoint, ExtensionId>
         >
         retVal = new Clazz(...tArgs) as InstanceType<ExtensionClass>
         this.extensionMap[key] = retVal as unknown as PayloadTypeKind<
            ExtensionPayloadTypeURIFromParts<ExtensionPoint, ExtensionId>
         >
      } else {
         throw new Error(`No extension registered for <${key}>`)
      }

      return retVal
   }

   classKeys(): string[] {
      return Object.keys(this.classMap)
   }

   keys(): string[] {
      return Object.keys(this.extensionMap)
   }
}
