// export const REGION_SPECS_BLOCKSTORE: unique symbol = Symbol("SharedArtBlockstore")
export const SHARED_ART_BLOCKSTORE = Symbol("SharedArtBlockstore");
export const SHARED_MAP_BLOCKSTORE = Symbol("SharedMapBlockstore");
export const SHARED_TASK_BLOCKSTORE = Symbol("SharedTaskBlockstore");
export const IPLD_REGION_MAP_SERDES = Symbol("RegionMapSerdes");
export const IPLD_ARTWORK_ITEM_SERDES = Symbol("ArtworkItemSerdes");
export const IPLD_PAINT_TASK_SERDES = Symbol("PaintTaskSerdes");
export const IPLD_PLOT_REGION_TASK_SERDES = Symbol("PlotRegionTaskSerdes");
export const SharedBlockstoresModuleTypes = {
    SharedArtBlockstore: SHARED_ART_BLOCKSTORE,
    SharedMapBlockstore: SHARED_MAP_BLOCKSTORE,
    SharedTaskBlockstore: SHARED_TASK_BLOCKSTORE
};
export const SharedBlockStoreSerdesMap = {
    SharedArtBlockstore: [IPLD_ARTWORK_ITEM_SERDES],
    SharedMapBlockStore: [IPLD_REGION_MAP_SERDES],
    SharedTaskBlockstore: [IPLD_PAINT_TASK_SERDES, IPLD_PLOT_REGION_TASK_SERDES]
};
//# sourceMappingURL=SharedBlockstoresModuleTypes.js.map