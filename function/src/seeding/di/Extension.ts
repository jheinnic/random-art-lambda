import { GenModelSeedAdapter } from "../components/GenModelSeedAdapter.js"

declare module "../../extensions/interface/IExtensionAdapter.js" {
   interface AdapterURItoKind<K extends string> {
      readonly "GenModelSeedType/GenModelSeedAdapter": GenModelSeedAdapter<K>
   }
}
