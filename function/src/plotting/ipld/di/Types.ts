const INJECTED_BLOCK_STORE: unique symbol = Symbol("Ipld::Plotting::Blockstore")
const IPLD_REGION_MAP_REPOSITORY: unique symbol = Symbol(
   "Ipld::Plotting::IRegionMapRepository",
)
const IPLD_MODEL_ENVELOPE_SERDES: unique symbol = Symbol(
   "Ipld::Plotting::ISerdes<ModelEnvelope>",
)
const IPLD_DATA_BLOCK_SERDES: unique symbol = Symbol(
   "Ipld::Plotting::ISerdes<DataBlock>",
)

const MODULE_CONFIGURATION: unique symbol = Symbol(
   "Ipld::Plotting::ModuleConfiguration",
)

export const IpldPlottingModuleTypes = {
   IpldRegionMapRepository: IPLD_REGION_MAP_REPOSITORY,
   IModelEnvelopeSerdes: IPLD_MODEL_ENVELOPE_SERDES,
   IDataBlockSerdes: IPLD_DATA_BLOCK_SERDES,
   InjectedBlockStore: INJECTED_BLOCK_STORE,
   ModuleConfiguration: MODULE_CONFIGURATION,
}
