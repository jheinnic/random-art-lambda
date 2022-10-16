import * as codec from "@ipld/dag-cbor"
import { Inject, Injectable } from "@nestjs/common"
import { BaseBlockstore } from "blockstore-core"
import { CID } from "multiformats"
import * as Block from "multiformats/block"
import { sha256 as hasher } from "multiformats/hashes/sha2"

import { SharedArtBlockstoreModuleTypes } from "../../ipfs/di/typez.js"
import { IRandomArtTaskBuilder } from "../interface/IRandomArtTaskBuilder.js"
import { RandomArtTask } from "./RandomArtTask.js"

// import * as Block from "multiformats/block"
export class RandomArtTaskRepository {
  constructor (@Inject(SharedArtBlockstoreModuleTypes.SharedArtBlockstore) private readonly blockStore: BaseBlockstore) { }

  public async create (director: (builder: IRandomArtTaskBuilder) => void): Promise<CID> {
    const builder = new RandomArtTaskBuilder(this)
    director(builder)
    return await builder.build()
  }

  public async save (source: RandomArtTask): Promise<CID> {
    // validate and transform ro block-encodable representation form
    const sourceData = rootTyped.toRepresentation({ RandomArtTask: source })
    if (sourceData === undefined) {
      throw new TypeError("Invalid typed form, does not match schema")
    }
    // Encode
    const rootBlock = await Block.encode({ codec, hasher, value: sourceData })
    // Store
    await this.blockStore.put(rootBlock.cid, rootBlock.bytes, {})
    return rootBlock.cid
  }

  public async load (cid: CID): Promise<RandomArtTask> {
    const bytes = await this.blockStore.get(cid)
    const rootBlock = await Block.decode({ codec, hasher, bytes })
    const typedData = rootTyped.toTyped(rootBlock.value)
    console.dir(typedData, { depth: Infinity })
    console.log(typedData.constructor.name)

    return typedData as RandomArtTask
  }
}

const NO_TERM = Uint8Array.of()
const NO_CID = CID.parse("bafyreidthqcofmbxevgnm2tm3wgkwlaue5wjomm2ofyef4avlpduy6y2he")

class RandomArtTaskBuilder implements IRandomArtTaskBuilder {
  private _prefix: Uint8Array = NO_TERM
  private _suffix: Uint8Array = NO_TERM
  private _plotMap: CID = NO_CID

  constructor (private readonly _repository: RandomArtTaskRepository) {
  }

  public prefix (bytes: Uint8Array): IRandomArtTaskBuilder {
    this._prefix = bytes
    return this
  }

  public suffix (bytes: Uint8Array): IRandomArtTaskBuilder {
    this._suffix = bytes
    return this
  }

  public plotMap (link: CID): IRandomArtTaskBuilder {
    this._plotMap = link
    return this
  }

  public async build (): Promise<CID> {
    const source = {
      prefix: this._prefix,
      suffix: this._suffix,
      plotMap: this._plotMap
    }
    return await this._repository.save(source)
  }
}
