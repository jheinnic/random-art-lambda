import "@reactivex/ix-ts/asynciterablex/add/reduce"

import { Inject, Injectable } from "@nestjs/common"
import { from } from "@reactivex/ix-ts/asynciterable"
import { Blockstore } from "interface-blockstore"
import { exporter, recursive, UnixFSEntry, UnixFSFile } from "ipfs-unixfs-exporter"
import { importer, ImportResult, UserImporterOptions } from "ipfs-unixfs-importer"
import { CID } from "multiformats"

import { concatAll } from "../../../util"
import { IpfsModuleTypes } from "../../ipfs/di/typez.js"
import { PaintingModuleTypes } from "../di/typez.js"
import { IRandomArtTaskRepository } from "../interface"
import { RandomArtTask } from "./RandomArtTask.js"

// import { AsyncIterable } from "@reactivex/ix-ts"
@Injectable()
export class OldRandomArtTaskRepository implements IRandomArtTaskRepository {
  private readonly _storeCache: {
    [K in string]: RandomArtTask;
  }

  private readonly _storeOptions: { signal?: AbortSignal }
  private readonly _importOptions: UserImporterOptions

  constructor (
    @Inject(IpfsModuleTypes.FilesystemBlockstore)
    private readonly blockstore: Blockstore,
    @Inject(PaintingModuleTypes.PlotModelDecoder)
    private readonly plotModelDecoder: IPlotModelDecoder
  ) { // private readonly publisher: EventPublisher) {
    this._storeCache = {}
    this._storeOptions = {}
    this._importOptions = {
      cidVersion: 0,
      chunker: "rabin",
      leafType: "file",
      strategy: "flat",
      onlyHash: false,
      rawLeaves: false,
      reduceSingleLeafToSelf: false
    }
  }

  public async create (
    plotMapCidStr: string,
    prefixBits: Uint8Array,
    suffixBits: Uint8Array
  ): Promise<RandomArtTask> {
    const plotMapBits: Uint8Array = await this._loadFileByCid(
      CID.parse(plotMapCidStr)
    )
    const list = [
      { path: "./plotMap", content: plotMapBits },
      { path: "./prefix", content: prefixBits },
      { path: "./suffix", content: suffixBits }
    ]
    const assets = this._walkBlockExport(
      await importer(list, this.blockstore, this._importOptions)
    )
    if (assets.rootFolder === undefined) {
      throw new Error(`No root folder assets for ${plotMapCidStr}`)
    }
    const rootCidStr: string = assets.rootFolder.toString()
    const retVal = new RandomArtTask(
      rootCidStr,
      prefixBits,
      (assets.prefixFile ?? "TBD").toString(),
      suffixBits,
      (assets.suffixFile ?? "TBD").toString(),
      plotMapBits,
      plotMapCidStr
    )
    // const retVal = this.eventPublisher.mergeObjectontext(
    // new RandomArtTask(assets.rootFolder.cid)
    // )
    // retVal.commit()
    this._storeCache[rootCidStr] = retVal
    return retVal
  }

  public save (task: RandomArtTask): void {
    const cid = task.cid
    this._storeCache[cid] = task
  }

  public getByCid (cid: string | CID): RandomArtTask {
    let cidObj: CID
    let cidStr: string
    if (cid instanceof CID) {
      cidObj = cid
      cidStr = cid.toString()
    } else {
      cidStr = cid.trim()
      if (cidStr === "") {
        throw new Error("Content Id must be non-empty and defined")
      }
      cidObj = CID.parse(cidStr)
    }
    if (cidStr in this._storeCache) {
      return this._storeCache[cidStr]
    }
    const assets: BlockAssets = this._walkBlockExport(
      recursive(cidObj, this.blockstore)
    )
    if (assets.rootFolder === undefined || assets.rootFolder.toString() !== cidStr) {
      console.log("Failed to find")
      throw new Error(`Failed to find ${cidStr}`)
    }
    const plotMapBits: Uint8Array = this._loadFileByCid(assets.plotMapFile)
    const prefixBits: Uint8Array = this._loadFileByCid(assets.prefixFile)
    const suffixBits: Uint8Array = this._loadFileByCid(assets.suffixFile)

    const retVal = new RandomArtTask(
      cidStr,
      prefixBits,
      assets.prefixFile,
      suffixBits,
      assets.suffixFile,
      plotMapBits,
      assets.plotMapFile
    )
    this._storageCache[cidStr] = retVal
    return retVal
  }

  public getAll (): RandomArtTask[] {
    return Object.values(this._storeCache)
  }

  private _walkBlockExport (
    source: AsyncGenerator<ImportResult> | AsyncGenerator<UnixFSEntry>
  ): BlockAssets {
    return from(source).reduce(
      (found: BlockAssets, entry: ImportResult | UnixFSEntry) => {
        switch (entry.path) {
          case ".": {
            found = { ...found, rootFolder: entry.cid }
            break
          }
          case "./plotMap": {
            found = { ...found, plotMapFile: entry.cid }
            break
          }
          case "./prefix": {
            found = { ...found, prefixFile: entry.cid }
            break
          }
          case "./suffix": {
            found = { ...found, suffixFile: entry.cid }
            break
          }
          default: {
            console.error(
              `Unexpected path: ${entry.path ?? ""} at ${entry.cid.toString()}`
            )
          }
        }
        return found
      },
      {}
    )
  }

  private async _loadFileByCid (cid: CID): Promise<Uint8Array> {
    const file: UnixFSFile = (await exporter(
      cid,
      this.blockstore,
      this._storeOptions
    )) as UnixFSFile
    const iterBits: AsyncIterable<Uint8Array> = from(
      await file.content({
        offset: 0,
        length: file.size,
        signal: this._storeOptions.signal
      })
    )
    return concatAll(iterBits, file.size)
  }
}

interface BlockAssets {
  rootFolder?: CID // UnixFSDirectory
  plotMapFile?: CID // UnixFSFile
  prefixFile?: CID // UnixFSFile
  suffixFile?: CID // UnixFSFile
}
