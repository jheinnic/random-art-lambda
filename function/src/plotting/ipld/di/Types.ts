// const MODULE_CONFIGURATION: unique symbol =

export const IpldPlottingModuleTypes = {
   IpldRegionMapRepository: Symbol("Ipld::Plotting::IRegionMapRepository"),
   IModelEnvelopeSerdes: Symbol("Ipld::Plotting::ISerdes<ModelEnvelope>"),
   IDataBlockSerdes: Symbol("Ipld::Plotting::ISerdes<DataBlock>"),
   InjectedBlockStore: Symbol("Ipld::Plotting::Blockstore"),
   ModuleConfiguration: Symbol("Ipld::Plotting::ModuleConfiguration"),
} as const
