import { Type } from "@nestjs/common"
import { IExtensionMatchmaker } from "./IExtensionMatchmaker.js"
import { IExtensionRegistrar } from "./IExtensionRegistrar.js"
import { IExtension } from "./IExtension.js"

export interface IExtensionWrangler<
   ExtensionPoint extends string,
   PayloadType extends IExtension,
   TArgs extends any[],
> extends IExtensionRegistrar<ExtensionPoint, PayloadType, TArgs>,
      IExtensionMatchmaker<ExtensionPoint, PayloadType, TArgs> {}
