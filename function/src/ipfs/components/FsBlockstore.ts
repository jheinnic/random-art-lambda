import { Inject, Injectable } from "@nestjs/common"
import { BaseBlockstore } from "blockstore-core"
import { Stats } from "fs"
import { mkdir, readFile, stat, unlink, writeFile } from "fs/promises"
import { Options } from "interface-blockstore"
import LRUCache from "lru-cache"
import { CID } from "multiformats"
import { base58btc } from "multiformats/bases/base58"
import { dirname, join } from "path"
import * as lockfile from "proper-lockfile"

import { IpfsModuleTypes } from "../di/typez.js"
import { FsBlockstoreConfiguration } from "../interface/FsBlockstoreConfiguration.js"

enum OpenState {
  CLOSED = "closed",
  OPENING = "opening",
  OPEN = "open",
  CLOSING = "closing"
}

@Injectable()
export class FsBlockstore extends BaseBlockstore {
  private static readonly NO_OP_RELEASE: () => Promise<void> = async () => {}

  private lockRelease: () => Promise<void> = FsBlockstore.NO_OP_RELEASE
  private readonly rootPath: string
  private openState: OpenState = OpenState.CLOSED

  constructor (
    @Inject(IpfsModuleTypes.FsBlockstoreConfig)
    readonly config: FsBlockstoreConfiguration,
    @Inject(IpfsModuleTypes.LruCache)
    private readonly lruCache: LRUCache<string, Uint8Array>
  ) {
    super()
    this.rootPath = config.rootPath
  }

  async open (): Promise<void> {
    if (this.openState === OpenState.OPEN) {
      return
    }
    if (this.openState !== OpenState.CLOSED) {
      throw new Error(`${this.openState} transition in progress`)
    }

    this.openState = OpenState.OPENING
    let rootStat: Stats
    try {
      rootStat = await stat(this.rootPath)
    } catch {
      await mkdir(this.rootPath)
      rootStat = await stat(this.rootPath)
    }
    if (!rootStat.isDirectory()) {
      this.openState = OpenState.CLOSED
      throw new Error(
        `Root path, ${this.rootPath}, must be a directory to open FsBlockStore!`
      )
    }
    this.lockRelease = await lockfile.lock(this.rootPath, {
      lockfilePath: join(this.rootPath, ".lock")
    })
    console.log("Lock acquired!")
    this.openState = OpenState.OPEN
  }

  /**
   * @returns {Promise<void>}
   */
  async close (): Promise<void> {
    if (this.openState === OpenState.CLOSED) {
      return
    }
    if (this.openState !== OpenState.OPEN) {
      throw Error(`${this.openState} transition in progress`)
    }
    this.openState = OpenState.CLOSING
    const releaseHandle = await this.lockRelease()
    console.log("Repository lock release initiated")
    console.log(await releaseHandle)
    console.log("Repository lock released")
    this.lockRelease = FsBlockstore.NO_OP_RELEASE
    this.openState = OpenState.CLOSED
  }

  /**
   * @param {CID} key
   * @param {Uint8Array} val
   * @param {Options} [options]
   * @returns {Promise<void>}
   */
  async put (key: CID, val: Uint8Array, options?: Options): Promise<void> {
    // if (val.length < 1000) {
    //   console.error(`${key.toString()} and ${JSON.stringify(val)}`)
    // } else {
    //   console.error(`${key.toString()} and ${val.length}`)
    // }
    this.assertIsOpen(options)
    const cidStr = fromCidToString(key)
    const blockPath = fromCidToPath(this.rootPath, cidStr)
    await mkdir(dirname(blockPath), { recursive: true, mode: "0700" })
    this.assertIsOpen(options)
    try {
      await writeFile(blockPath, val, {
        signal: options?.signal,
        mode: "0600"
      })
      this.lruCache.set(cidStr, val)
    } catch (err: any) {
      this.lruCache.delete(cidStr)
      await unlink(blockPath)
      throw err
    }
  }

  /**
   * @param {CID} key
   * @param {Options} [options]
   * @returns {Promise<Uint8Array>}
   */
  async get (key: CID, options?: Options): Promise<Uint8Array> {
    this.assertIsOpen(options)
    let val: Uint8Array | undefined
    const cidStr = fromCidToString(key)
    if (options?.signal === undefined) {
      val = await this.lruCache.fetch(cidStr)
    } else {
      const signal: AbortSignal = options.signal
      const lruCache: LRUCache<string, Uint8Array> = this.lruCache
      function abortFetch (): void {
        // TODO: Validate expectation that this will also abort the async fetchMethod!
        lruCache.delete(cidStr)
      }

      signal.addEventListener("abort", abortFetch, { once: true })
      val = await this.lruCache.fetch(cidStr)
      signal.removeEventListener("abort", abortFetch)
    }

    if (val === undefined) {
      throw new Error(`${cidStr} not found!`)
    }
    return val
  }

  /**
   * @param {CID} key
   * @param {Options} [options]
   * @returns {Promise<boolean>}
   */
  async has (key: CID, options?: Options): Promise<boolean> {
    this.assertIsOpen(options)
    const cidStr: string = fromCidToString(key)
    if (this.lruCache.has(cidStr)) {
      return true
    }
    const blockPath = fromCidToPath(this.rootPath, cidStr)
    try {
      await stat(blockPath)
      return true
    } catch {
      return false
    }
  }

  /**
   * @param {CID} key
   * @param {Options} [options]
   * @returns {Promise<void>}
   */
  async delete (key: CID, options?: Options): Promise<void> {
    this.assertIsOpen(options)
    const cidStr = fromCidToString(key)
    const blockPath = fromCidToPath(this.rootPath, cidStr)
    this.lruCache.delete(cidStr)
    await unlink(blockPath)
  }

  private assertIsOpen (options?: Options): void {
    if (this.openState !== OpenState.OPEN) {
      throw new Error(`${this.openState} is not Open`)
    }
    if (options != null) {
      const { signal }: { signal?: AbortSignal } = { ...options }
      if (signal?.aborted === true) throw new Error("Operation canceled")
    }
  }
}

function fromCidToString (cid: CID): string {
  try {
    // return cid.toV0().toString()
    return cid.toString(base58btc)
  } catch {
    return cid.toString()
  }
}

function fromCidToPath (rootPath: string, keyStr: string): string
function fromCidToPath (rootPath: string, cidKey: CID): string
function fromCidToPath (rootPath: string, key: string | CID): string {
  let keyStr: string = ""
  if (typeof key === "string") {
    keyStr = key
  } else {
    keyStr = fromCidToString(key)
  }

  return join(
    rootPath,
    keyStr.slice(-6, -4),
    keyStr.slice(-4, -2),
    keyStr.slice(-2),
    keyStr.slice(0, -6)
  )
}

async function fetchMethod (
  cidStr: string,
  staleValue: Uint8Array,
  { signal, context }: { signal: AbortSignal, context: string }
): Promise<Uint8Array> {
  const blockPath = fromCidToPath(context, cidStr)
  const readBuf: Buffer = await readFile(blockPath, { signal })
  return Uint8Array.from(readBuf)
}

export function buildLruCache (
  config: FsBlockstoreConfiguration
): LRUCache<string, Uint8Array> {
  return new LRUCache<string, Uint8Array>({
    max: config.cacheSize,
    fetchContext: config.rootPath,
    fetchMethod
  })
}
