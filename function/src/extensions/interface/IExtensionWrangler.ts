import { KnownExtensionPointIds } from "../kinds/index.js"
import { IExtensionMatchmaker } from "./IExtensionMatchmaker.js"
import { IExtensionRegistrar } from "./IExtensionRegistrar.js"

export interface IExtensionWrangler<
   ExtensionPoint extends KnownExtensionPointIds,
> extends IExtensionRegistrar<ExtensionPoint>,
      IExtensionMatchmaker<ExtensionPoint> {}
