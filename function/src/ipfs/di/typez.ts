export const ABSTRACT_BLOCKSTORE: unique symbol = Symbol("BaseBlockstore")
export const LRU_CACHE: unique symbol = Symbol("LRU")
export const FS_BLOCKSTORE_CONFIG: unique symbol = Symbol("FsBlockstoreConfig")
export const SHARED_ART_BLOCKSTORE: unique symbol = Symbol("SharedArtBlockstore")

export const IpfsModuleTypes = {
  AbstractBlockstore: ABSTRACT_BLOCKSTORE,
  LruCache: LRU_CACHE,
  FsBlockstoreConfig: FS_BLOCKSTORE_CONFIG
}

export const SharedArtBlockstoreModuleTypes = {
  SharedArtBlockstore: SHARED_ART_BLOCKSTORE
}
