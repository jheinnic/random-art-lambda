import { Logger } from "@nestjs/common"
import { IExtension, IExtensionClass } from "./IExtension.js"

interface IUIComponentExtension extends IExtension {
   render: () => void
}
interface IDataSourceExtension extends IExtension {
   fetch: () => void
}

// 🎯 FIX: UI components must always take a Logger and a Config object.
type UIComponentClass<EID extends string> = IExtensionClass<
   "ui-component",
   EID,
   IUIComponentExtension,
   // TArgs is FIXED here as [Logger, UIConfig]
   [Logger, UIConfig]
>

// 🎯 FIX: Data Sources must always take a ConnectionString.
type DataSourceClass<EID extends string> = IExtensionClass<
   "data-source",
   EID,
   IDataSourceExtension,
   // TArgs is FIXED here as [string]
   [string]
>
