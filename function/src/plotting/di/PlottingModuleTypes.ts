export const IPLD_REGION_MAP_REPOSITORY: unique symbol = Symbol("IpldRegionMapRepository")
export const IPLD_REGION_MAP_SCHEMA_DSL: unique symbol = Symbol("IpldRegionMapSchemaDsl")
export const PROTO_BUF_ADAPTER_FACTORY: unique symbol = Symbol("ProtoBufAdapterFactory")
export const INJECTED_BLOCK_STORE: unique symbol = Symbol("Blockstore")
export const PLOTTING_MODULE_CONFIGURATION: unique symbol = Symbol("PlottingModuleConfiguration")

export const PlottingModuleTypes = {
  IRegionMapRepository: IPLD_REGION_MAP_REPOSITORY,
  IRegionMapSchemaDsl: IPLD_REGION_MAP_SCHEMA_DSL,
  ProtoBufAdapterFactory: PROTO_BUF_ADAPTER_FACTORY,
  InjectedBlockStore: INJECTED_BLOCK_STORE,
  PlottingModuleConfiguration: PLOTTING_MODULE_CONFIGURATION
}
