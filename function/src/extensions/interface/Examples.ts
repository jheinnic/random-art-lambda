import { Logger } from "@nestjs/common"
import "./IExtension.js"

interface IUIComponentExtension {
   render: () => void
}
interface IDataSourceExtension {
   fetch: () => void
}

export {}

declare module "./IExtension.js" {
   interface ExtensionPayloadTypeURItoKind {
      readonly "Examples/ui-component": IUIComponentExtension
      readonly "Examples/data-source": IDataSourceExtension
   }
   interface ExtensionTArgsURItoKind {
      readonly "Examples/ui-component": [Logger]
      readonly "Examples/data-source": [string]
   }
   // 🎯 FIX: UI components must always take a Logger and a Config object.
   type UIComponentClass = IExtensionClass<"Examples", "ui-component">

   // 🎯 FIX: Data Sources must always take a ConnectionString.
   type DataSourceClass = IExtensionClass<"Examples", "data-source">
}
