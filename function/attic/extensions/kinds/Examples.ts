import { Logger } from "@nestjs/common"
import { ExtensionClassKind, KnownExtensionIds } from "./ExtPointKind.js"

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

declare module "../../extensions/kinds/ExtPointHooks.js" {
   export interface HooksForExtPayload<_ExtensionId extends string> {
      readonly Examples: _ExtensionId extends "ui-component"
         ? IUIComponentExtension
         : IDataSourceExtension
   }
   export interface HooksForExtTArgs<_ExtensionId extends string> {
      readonly Examples: _ExtensionId extends "ui-component"
         ? [Logger]
         : [string]
   }

   export interface HooksForExtStaticPayload<_ExtensionId extends string> {
      readonly Examples: {}
   }

   // eslint-disable-next-line @typescript-eslint/no-empty-interface
   export interface HooksForAdapterFactories<_ExtensionId extends string> {}

   // eslint-disable-next-line @typescript-eslint/no-empty-interface
   export interface HooksForExtensions {
      "ui-component": typeof UIComponentExtension
      "data-source": typeof DataSourceExtension
   }

   export interface HooksForHooksForAdapterFactory<
      // ExtensionPoint extends KnownExtensionPointIds,
      ExtensionId extends string, // KnownExtensionIds<ExtensionPoint>,
   > {
      readonly Examples: HooksForAdapterFactories<ExtensionId>
   }

   interface HooksForHooksForExtensionClasses {
      readonly Examples: HooksForExtensions
   }
}
export type UIComponentClass = ExtensionClassKind<"Examples", "ui-component">

export type DataSourceClass = ExtensionClassKind<"Examples", "data-source">

export type LaLa = KnownExtensionIds<"Examples">
