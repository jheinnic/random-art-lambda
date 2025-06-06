export const INJECTED_BLOCK_STORE = Symbol("Blockstore");
export const IPLD_REGION_MAP_REPOSITORY = Symbol("IpldRegionMapRepository");
export const IPLD_MODEL_ENVELOPE_SERDES = Symbol("IpldModelEnvelopeSerdes");
export const IPLD_DATA_BLOCK_SERDES = Symbol("IpldDataBlockSerdes");
export const PROTO_BUF_ADAPTER_FACTORY = Symbol("ProtoBufAdapterFactory");
export const PLOTTING_MODULE_CONFIGURATION = Symbol("PlottingModuleConfiguration");
export const PlottingModuleTypes = {
    IRegionMapRepository: IPLD_REGION_MAP_REPOSITORY,
    IModelEnvelopeSerdes: IPLD_MODEL_ENVELOPE_SERDES,
    IDataBlockSerdes: IPLD_DATA_BLOCK_SERDES,
    ProtoBufAdapterFactory: PROTO_BUF_ADAPTER_FACTORY,
    InjectedBlockStore: INJECTED_BLOCK_STORE,
    PlottingModuleConfiguration: PLOTTING_MODULE_CONFIGURATION
};
//# sourceMappingURL=PlottingModuleTypes.js.map