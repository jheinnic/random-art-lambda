import { IExtensionMatchmaker } from "./IExtensionMatchmaker.js"
import { IExtensionRegistrar } from "./IExtensionRegistrar.js"

export interface IExtensionWrangler<
   ExtensionPoint extends string,
   ExtensionApi extends {},
> extends IExtensionRegistrar<ExtensionPoint, ExtensionApi>,
      IExtensionMatchmaker<ExtensionPoint, ExtensionApi> {}
