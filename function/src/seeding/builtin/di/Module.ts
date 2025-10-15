export const GEN_MODEL_SEED_ADAPTER_ID_STR = "GenModelSeedAdapter"
export type GEN_MODEL_SEED_ADAPTER_ID = typeof GEN_MODEL_SEED_ADAPTER_ID_STR

declare module "../../extensions/interface/IExtensionAdapter.js" {
   interface AdapterURItoKind<K extends string> {
      readonly "GenModelSeedType/GenModelSeedAdapter": GenModelSeedAdapter<K>
   }
}
