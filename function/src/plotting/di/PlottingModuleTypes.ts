export const INJECTED_BLOCK_STORE: unique symbol = Symbol( "Blockstore" )
export const IPLD_REGION_MAP_REPOSITORY: unique symbol = Symbol( "IpldRegionMapRepository" )
export const IPLD_MODEL_ENVELOPE_SERDES: unique symbol = Symbol( "IpldModelEnvelopeSerdes" )
export const IPLD_DATA_BLOCK_SERDES: unique symbol = Symbol( "IpldDataBlockSerdes" )
export const PROTO_BUF_ADAPTER_FACTORY: unique symbol = Symbol( "ProtoBufAdapterFactory" )
export const PLOTTING_MODULE_CONFIGURATION: unique symbol = Symbol( "PlottingModuleConfiguration" )

export const PlottingModuleTypes = {
  IRegionMapRepository: IPLD_REGION_MAP_REPOSITORY,
  IModelEnvelopeSerdes: IPLD_MODEL_ENVELOPE_SERDES,
  IDataBlockSerdes: IPLD_DATA_BLOCK_SERDES,
  ProtoBufAdapterFactory: PROTO_BUF_ADAPTER_FACTORY,
  InjectedBlockStore: INJECTED_BLOCK_STORE,
  PlottingModuleConfiguration: PLOTTING_MODULE_CONFIGURATION
}
