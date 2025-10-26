import { GenModelSeedAdapter } from "../components/GenModelSeedAdapter.js"
import { KnownPayloadIds } from "../../extensions/kinds/index.js"

declare module "../../extensions/kinds/ExtensionAdapterKind.js" {
   export interface ExtensionAdapterURItoKind<
      ExtensionPoint extends string,
      ExtensionId extends KnownPayloadIds<ExtensionPoint>,
   > {
      readonly "GenModelSeed/GenModelSeedAdapter": GenModelSeedAdapter<ExtensionId>
   }
}
