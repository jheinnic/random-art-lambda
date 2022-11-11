export const ABSTRACT_BLOCKSTORE: unique symbol = Symbol("Blockstore")
export const LRU_CACHE: unique symbol = Symbol("LRU")
export const FS_BLOCKSTORE_CONFIG: unique symbol = Symbol("FsBlockstoreConfiguration")

export const IpfsModuleTypes = {
  AbstractBlockstore: ABSTRACT_BLOCKSTORE,
  FsBlockstoreConfiguration: FS_BLOCKSTORE_CONFIG,
  LruCache: LRU_CACHE
}

export const REGISTER_METHOD_KEY = "register"
export const FACTORY_METHOD_KEY = "create"
