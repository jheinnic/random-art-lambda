import { IExtensionMatchmaker } from "./IExtensionMatchmaker.js"
import { IExtensionRegistrar } from "./IExtensionRegistrar.js"

export interface IExtensionWrangler<ExtensionPoint extends string>
   extends IExtensionRegistrar<ExtensionPoint>,
      IExtensionMatchmaker<ExtensionPoint> {}
