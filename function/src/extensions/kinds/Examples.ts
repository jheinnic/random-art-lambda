import { Logger } from "@nestjs/common"
import "./ExtensionClassKind._st"
import { ExtensionClassKind } from "./ExtensionKind.js"

interface IUIComponentExtension {
   render: () => void
}
interface IDataSourceExtension {
   fetch: () => void
}

export {}

declare module "./ExtensionKind.js" {
   interface ExtensionPayloadTypeURItoKind {
      readonly "Examples/ui-component": IUIComponentExtension
      readonly "Examples/data-source": IDataSourceExtension
   }
   interface ExtensionTArgsURItoKind {
      readonly "Examples/ui-component": [Logger]
      readonly "Examples/data-source": [string]
   }
   // 🎯 FIX: UI components must always take a Logger and a Config object.
   type UIComponentClass = ExtensionClassKind<"Examples", "ui-component">

   // 🎯 FIX: Data Sources must always take a ConnectionString.
   type DataSourceClass = ExtensionClassKind<"Examples", "data-source">
}
