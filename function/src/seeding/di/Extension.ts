import { KnownExtensionIds } from "../../extensions/interface/IExtension.js"
import { GenModelSeedAdapter } from "../components/GenModelSeedAdapter.js"
import { SeedModelKind } from "../interface/SeedModelKind.js"

declare module "../../extensions/interface/IExtensionAdapter.js" {
   interface ExtensionAdapterURItoKind<
      ExtensionPoint extends string,
      _ExtensionId extends KnownExtensionIds<ExtensionPoint>,
   > {
      readonly "GenModelSeedType/GenModelSeedAdapter": GenModelSeedAdapter<_ExtensionId>
   }
}
