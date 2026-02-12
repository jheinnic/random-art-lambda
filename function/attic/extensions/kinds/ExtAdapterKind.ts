import { StringKeys } from "simplytyped"
import { KnownExtensionPointIds, KnownExtensionIds } from "./ExtPointKind.js"
import { HooksForHooksForAdapterFactory } from "./ExtPointHooks.js"

// 1. Base interface that plugins will augment
// eslint-disable-next-line @typescript-eslint/no-empty-interface
// 2. Extract valid URIs from whatever gets registered
export type KnownExtensionAdapterIds<
   ExtensionPoint extends KnownExtensionPointIds,
> = StringKeys<
   HooksForHooksForAdapterFactory<
      KnownExtensionIds<ExtensionPoint>
   >[ExtensionPoint]
>

// 3. Lookup helper
export type ExtensionAdapterKind<
   ExtensionPoint extends KnownExtensionPointIds,
   AdapterId extends KnownExtensionAdapterIds<ExtensionPoint>,
   ExtensionId extends KnownExtensionIds<ExtensionPoint>,
> = HooksForHooksForAdapterFactory<ExtensionId>[ExtensionPoint][AdapterId]
