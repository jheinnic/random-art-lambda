// export const REGION_SPECS_BLOCKSTORE: unique symbol = Symbol("SharedArtBlockstore")
export const SHARED_ART_BLOCKSTORE: unique symbol = Symbol("SharedArtBlockstore")
export const SHARED_MAP_BLOCKSTORE: unique symbol = Symbol("SharedMapBlockstore")
export const SHARED_TASK_BLOCKSTORE: unique symbol = Symbol("SharedTaskBlockstore")

export const SharedBlockstoresModuleTypes = {
  SharedArtBlockstore: SHARED_ART_BLOCKSTORE,
  SharedMapBlockstore: SHARED_MAP_BLOCKSTORE,
  SharedTaskBlockstore: SHARED_TASK_BLOCKSTORE
}
