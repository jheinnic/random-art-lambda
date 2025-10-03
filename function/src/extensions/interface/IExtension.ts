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

// export interface IExtensionClass<
//    in out ExtensionPoint extends string,
//    out ExtensionId extends string,
// > extends Function {
//    new (...args: any[]): any
//    extensionFor: ExtensionPoint
//    extensionId: ExtensionId
// }

// type CompatibleWith<C extends Type, Api extends {}> =
//    InstanceType<C> extends Api ? C : never

// export type CompatibleIExtensionClass<
//    ExtensionPoint extends string,
//    ExtensionApi extends {},
//    ExtensionClass extends IExtensionClass<ExtensionPoint>,
//    ExtensionId extends string = string,
// > = CompatibleWith<ExtensionClass, ExtensionApi> & { extensionId: ExtensionId }

// export type IExtension<
//    ExtensionPoint extends string,
//    ExtensionId extends string = string,
//    Constructor extends IExtensionClass<
//       ExtensionPoint,
//       ExtensionId
//    > = IExtensionClass<ExtensionPoint, ExtensionId>,
// > = InstanceType<Constructor>

// export type IsIExtension<
//    I extends object,
//    ExtensionPoint extends string,
//    ExtensionApi extends {} = {},
//    ExtensionId extends string = string,
// > = I extends IExtension<ExtensionPoint, ExtensionId> & ExtensionApi ? I : never
// Assuming this is the type of object the class creates

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IExtension {
   /* common instance methods/properties */
}

export interface IExtensionKey<
   in out ExtensionPoint extends string,
   out ExtensionId extends string,
> {
   extensionFor: ExtensionPoint
   extensionId: ExtensionId
}

// IExtensionClass models the constructor and static fields of any extension class
export interface IExtensionClass<
   in out ExtensionPoint extends string,
   out ExtensionId extends string,
   Instance extends IExtension, // The instance type created by the constructor
   Params extends any[],
> extends Function {
   // Constructor signature
   new (...args: Params): Instance
   // Static properties required for registration
   extensionFor: ExtensionPoint
   extensionId: ExtensionId
}
