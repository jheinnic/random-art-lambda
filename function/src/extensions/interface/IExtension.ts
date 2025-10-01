import { Type } from "@nestjs/common"

// export type IExtension<
//    ExtensionPoint extends string,
//    ExtensionId extends string,
// > = Type<{
//    extensionFor: ExtensionPoint
//    extensionId: ExtensionId
// }>

// export type AltIExtension<
//    T extends Type<any>,
//    ExtensionPoint extends string,
//    ExtensionId extends string,
// > = T extends Type<infer R> & {
//    extensionFor: ExtensionPoint
//    extensionId: ExtensionId
// }
//    ? R
//    : never

// export type AltIExtension2<T extends Type<any>> = T extends Type<infer R> & {
//    extensionFor: string
//    extensionId: string
// }
//    ? R
//    : never

// export type AltExtensionPoint<T extends Type<any>> = T extends {
//    extensionFor: infer EP
//    extensionId: string
// }
//    ? EP
//    : never

// export interface IAnyExtension<ExtensionPoint extends string> {
//    extensionFor: ExtensionPoint
//    extensionId: string
// }

// export interface IExtension<
//    ExtensionPoint extends string,
//    ExtensionId extends string,
// > {
//    extensionFor: ExtensionPoint
//    extensionId: ExtensionId
// }
//
// export interface IAnyExtension<ExtensionPoint extends string> {
//    extensionFor: ExtensionPoint
//    extensionId: string
// }

export interface IExtensionClass<
   in out ExtensionPoint extends string,
   out ExtensionId extends string = string,
> extends Function {
   new (...args: any[]): any
   extensionFor: ExtensionPoint
   extensionId: ExtensionId
}

type CompatibleWith<C extends Type, Api extends {}> =
   InstanceType<C> extends Api ? C : never

export type CompatibleIExtensionClass<
   ExtensionPoint extends string,
   ExtensionApi extends {},
   ExtensionClass extends IExtensionClass<ExtensionPoint>,
   ExtensionId extends string = string,
> = CompatibleWith<ExtensionClass, ExtensionApi> & { extensionId: ExtensionId }

export interface IExtension<
   ExtensionPoint extends string,
   ExtensionId extends string = string,
> {
   constructor: IExtensionClass<ExtensionPoint, ExtensionId>
}
