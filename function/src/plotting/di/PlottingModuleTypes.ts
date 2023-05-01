export const IPLD_REGION_MAP_REPOSITORY: unique symbol = Symbol( "IpldRegionMapRepository" )
export const IPLD_REGION_MAP_SCHEMA_SERDES: unique symbol = Symbol( "IpldRegionMapSchemaSerdes" )
export const IPLD_DATA_BLOCK_SCHEMA_SERDES: unique symbol = Symbol( "IpldDataBlockSchemaSerdes" )
export const PROTO_BUF_ADAPTER_FACTORY: unique symbol = Symbol( "ProtoBufAdapterFactory" )
export const INJECTED_BLOCK_STORE: unique symbol = Symbol( "Blockstore" )
export const PLOTTING_MODULE_CONFIGURATION: unique symbol = Symbol( "PlottingModuleConfiguration" )

export const PlottingModuleTypes = {
  IRegionMapRepository: IPLD_REGION_MAP_REPOSITORY,
  IRegionMapSchemaSerdes: IPLD_REGION_MAP_SCHEMA_SERDES,
  IDataBlockSchemaSerdes: IPLD_DATA_BLOCK_SCHEMA_SERDES,
  ProtoBufAdapterFactory: PROTO_BUF_ADAPTER_FACTORY,
  InjectedBlockStore: INJECTED_BLOCK_STORE,
  PlottingModuleConfiguration: PLOTTING_MODULE_CONFIGURATION
}
