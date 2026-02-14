import { Logger } from "@nestjs/common"
import { ExtensionClassKind, KnownExtensionIds } from "./ExtensionKind.js"

interface IUIComponentExtension {
   render: () => void
}
interface IDataSourceExtension {
   fetch: () => void
}

class UIComponentExtension implements IUIComponentExtension {
   static readonly extensionFor: "Examples" = "Examples"
   static readonly extensionId: "ui-component" = "ui-component"

   constructor(private readonly logger: Logger) {}

   render(): void {
      console.log("Rendering!")
   }
}

class DataSourceExtension implements IDataSourceExtension {
   static readonly extensionFor: "Examples" = "Examples"
   static readonly extensionId: "data-source" = "data-source"

   constructor(data: string) {
      console.log(data)
   }

   fetch(): void {
      console.log("Fetching")
   }
}

export {}

declare module "../../extensions/kinds/ExtensionPoints.js" {
   export interface PointForExtPayload<_ExtensionId extends string> {
      readonly Examples: _ExtensionId extends "ui-component"
         ? IUIComponentExtension
         : IDataSourceExtension
   }
   export interface PointForExtTArgs<_ExtensionId extends string> {
      readonly Examples: _ExtensionId extends "ui-component"
         ? [Logger]
         : [string]
   }

   export interface PointForExtStaticPayload<_ExtensionId extends string> {
      readonly Examples: {}
   }

   // eslint-disable-next-line @typescript-eslint/no-empty-interface
   export interface PointForAdapterFactories<_ExtensionId extends string> {}

   // eslint-disable-next-line @typescript-eslint/no-empty-interface
   export interface PointForExtensions {
      "ui-component": typeof UIComponentExtension
      "data-source": typeof DataSourceExtension
   }

   export interface PointForPointForAdapterFactory<
      // ExtensionPoint extends KnownExtensionPointIds,
      ExtensionId extends string, // KnownExtensionIds<ExtensionPoint>,
   > {
      readonly Examples: PointForAdapterFactories<ExtensionId>
   }

   interface PointForPointForExtensions {
      readonly Examples: PointForExtensions
   }
}
export type UIComponentClass = ExtensionClassKind<"Examples", "ui-component">

export type DataSourceClass = ExtensionClassKind<"Examples", "data-source">

export type LaLa = KnownExtensionIds<"Examples">
