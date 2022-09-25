export const PROTO_BUF_PLOT_REGION_MAP_DECODER: unique symbol = Symbol(
  "PBufRegionMapDecoder"
)
export const IPLD_REGION_MAP_REPOSITORY: unique symbol = Symbol("IpldRegionMapRepository")
export const IPLD_REGION_MAP_SCHEMA_DSL: unique symbol = Symbol("IpldRegionMapSchemaDsl")
export const PROTO_BUF_ADAPTER: unique symbol = Symbol("ProtoBufAdapter")
export const IMPORTED_BLOCK_STORE: unique symbol = Symbol("BaseBlockstore")

export const PlottingModuleTypes = {
  PBufPlotRegionMapDecoder: PROTO_BUF_PLOT_REGION_MAP_DECODER,
  IpldRegionMapRepository: IPLD_REGION_MAP_REPOSITORY,
  IpldRegionMapSchemaDsl: IPLD_REGION_MAP_SCHEMA_DSL,
  ProtoBufAdapter: PROTO_BUF_ADAPTER,
  ImportedBlockStore: IMPORTED_BLOCK_STORE
}
