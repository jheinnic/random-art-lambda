import { IExtension, IExtensionClass } from "../interface/IExtension.js"
import { IExtensionCollection } from "../interface/IExtensionCollection.js"

export class ExtensionCollection<
   ExtensionPoint extends string,
   PayloadType extends IExtension,
   TArgs extends any[],
> implements IExtensionCollection<ExtensionPoint, PayloadType, TArgs>
{
   private readonly extensionMap: Map<string, IExtension>

   private readonly classMap: Map<
      string,
      IExtensionClass<ExtensionPoint, string, PayloadType, TArgs>
   >

   constructor() {
      this.extensionMap = new Map()
      this.classMap = new Map()
   }

   setClass<
      ExtensionId extends string,
      ExtensionClass extends IExtensionClass<
         ExtensionPoint,
         ExtensionId,
         PayloadType,
         TArgs
      >,
   >(key: ExtensionId, clazz: ExtensionClass): void {
      this.classMap.set(key, clazz)
   }

   set<
      ExtensionId extends string,
      ExtensionClass extends IExtensionClass<
         ExtensionPoint,
         ExtensionId,
         PayloadType,
         TArgs
      >,
   >(
      key: ExtensionId,
      _clazz: ExtensionClass,
      value: InstanceType<ExtensionClass>,
   ): void {
      this.extensionMap.set(key, value)
   }

   getClass<
      ExtensionId extends string,
      ExtensionClass extends IExtensionClass<
         ExtensionPoint,
         ExtensionId,
         PayloadType,
         TArgs
      >,
   >(key: ExtensionId): ExtensionClass | undefined {
      const retVal = this.classMap.get(key)

      return retVal === undefined ? retVal : (retVal as ExtensionClass)
   }

   get<
      ExtensionId extends string,
      ExtensionClass extends IExtensionClass<
         ExtensionPoint,
         ExtensionId,
         PayloadType,
         TArgs
      >,
   >(
      key: ExtensionId,
      _clazz: ExtensionClass,
   ): InstanceType<ExtensionClass> | undefined {
      const retVal = this.extensionMap.get(key)

      return retVal === undefined
         ? retVal
         : (retVal as InstanceType<ExtensionClass>)
   }

   classKeys(): string[] {
      return [...this.classMap.keys()]
   }

   keys(): string[] {
      return [...this.extensionMap.keys()]
   }
}
