import { Inject, Injectable } from "@nestjs/common"
import { CID } from "multiformats"
import { Canvas } from "canvas"
import { sha256 as hasher } from "multiformats/hashes/sha2"
import crypto from 'crypto'
import fs from 'fs'

import { PaintingModuleTypes } from "../../painting/di/index.js"
import { PlottingModuleTypes } from "../../plotting/di/index.js"
import { IRandomArtworkRepository, IRandomArtTaskEngine, IPixelPainter } from "../../painting/interface/index.js"
import { IRegionMapRepository, IRegionMap } from "../../plotting/interface/index.js"
import { PBufAdapterFactory } from "../../plotting/protobuf/PBufAdapterFactory.js"
import { CanvasPixelPainter } from "../../painting/components/CanvasPixelPainter.js"
import { CanvasPersister } from "../../painting/components/CanvasPersister.js"
import { GenModelArtist } from "../../painting/components/GenModelArtist.js"
import { GenModel, newPicture, oldPicture } from "../../painting/components/genjs6.js"
import { PBufAdapter } from "../../plotting/protobuf/PBufAdapter.js"

type Task = { genModel: GenModel, fileName: string }
type Region = { name: string, regionMap: IRegionMap }

@Injectable()
export class AppServiceTwo {
  private readonly cidCache: Map<CID, IRegionMap> = new Map()

  public constructor (
    @Inject( PlottingModuleTypes.IRegionMapRepository )
    private readonly mapRepo: IRegionMapRepository,
    @Inject( PlottingModuleTypes.ProtoBufAdapterFactory )
    private readonly adapterFactory: PBufAdapterFactory,
    // @Inject( PaintingModuleTypes.IRandomArtPainter )
    // @Inject( PaintingModuleTypes.IRandomArtTaskEngine )
    // private readonly taskRepo: IRandomArtTaskEngine,
  ) { }

  public async testRepo( cid: CID ): Promise<IRegionMap | undefined> {
    if ( !this.cidCache.has( cid ) ) {
      await this.mapRepo.load( cid ).then( ( loadedMap ) => {
        console.log( "Repo loaded:" )
        console.log( loadedMap )
        if ( !this.cidCache.has( cid ) ) {
          this.cidCache.set( cid, loadedMap )
        }
      } )
    }

    // const adapter: PBufAdapter = this.adapterFactory.adapt( "./qdoc2.proto" )
    // const modelCid: CID = await this.mapRepo.import(
    // adapter.asDirector()
    // )
    // const regionMap2: IRegionMap = await this.mapRepo.load( modelCid )
    return this.cidCache.get( cid )
  }

  public async testRun0(): Promise<void> {
    const beginString: string = "Happy Thanksgiving Burger"
    const beginBuf: Buffer = Buffer.from( beginString )
    const beginArray: Uint8Array = Uint8Array.from( beginBuf )

    const adapter: PBufAdapter = this.adapterFactory.adapt( "./qdoc2.proto" )
    const regionMap: IRegionMap = adapter.asRegionMap()

    let hashBuf = beginArray
    while ( true ) {
      hashBuf = await hasher.encode( hashBuf )
      const prefix = hashBuf.slice( 0, 16 )
      const suffix = hashBuf.slice( 16 )
      const prefStr = Buffer.from( prefix ).toString( 'hex' )
      const suffStr = Buffer.from( suffix ).toString( 'hex' )
      const fileName = `./${ prefStr }_${ suffStr }.png`
      const genModel: GenModel = newPicture( [ ...prefix ], [ ...suffix ] )
      await this.doOne( genModel, regionMap, fileName )
    }
  }

  public testRun1(): Promise<void> {
    const workList: { prefix: string, suffix: string }[] =
      JSON.parse( fs.readFileSync( "source.list" ).toString() )
    const taskList: Task[] = workList.map(
      ( task ) => {
        let buf: Buffer = Buffer.from( task.prefix, "hex" )
        const prefix: Uint8Array = Uint8Array.from( buf )
        buf = Buffer.from( task.suffix, "hex" )
        const suffix: Uint8Array = Uint8Array.from( buf )
        return {
          genModel: newPicture( [ ...prefix ], [ ...suffix ] ),
          fileName: `${ task.prefix }_${ task.suffix }.png`
        }
      }
    )

    const sourceNames: string[] = [ "qdoc4", "qdoc5", "qdoc6" ]
    const regionList: Region[] = sourceNames.map(
      ( sourceName: string ) => {
        const adapter: PBufAdapter = this.adapterFactory.adapt( `./${ sourceName }.proto` )
        return { name: sourceName, regionMap: adapter.asRegionMap() }
      }
    )

    return this.runCombinations( taskList, regionList )
  }

  public testRun(): Promise<void> {
    const workList: { phrase: string }[] =
      JSON.parse( fs.readFileSync( "source2.list" ).toString() )
    const taskList: Task[] = workList.map(
      ( task ) => {
        const fileName: string = crypto.createHash( 'md5' )
          .update( task.phrase )
          .digest()
          .toString( 'base64' )
          .replaceAll( '/', '_' )
          .replaceAll( '=', '' )
        return {
          genModel: oldPicture( task.phrase ),
          fileName: `${ fileName }.png`
        }
      }
    )

    // const sourceNames: string[] = [ "qdoc4", "qdoc5", "qdoc6" ]
    const sourceNames: string[] = [ "rdoc" ]
    const regionList: Region[] = sourceNames.map(
      ( sourceName: string ) => {
        const adapter: PBufAdapter = this.adapterFactory.adapt( `./${ sourceName }.proto` )
        return { name: sourceName, regionMap: adapter.asRegionMap() }
      }
    )

    return this.runCombinations( taskList, regionList )
  }

  public async runCombinations( taskList: Task[], regionList: Region[] ): Promise<void> {
    let task: Task
    for ( task of taskList ) {
      await Promise.all(
        regionList.map(
          ( region: Region ) => {
            const fileName = `./${ region.name }/${ task.fileName }`
            return this.doOne( task.genModel, region.regionMap, fileName )
          }
        )
      )
    }
  }

  private async doOne( genModel: GenModel, regionMap: IRegionMap, fileName: string ): Promise<void> {
    const canvas: Canvas = new Canvas( regionMap.pixelWidth, regionMap.pixelHeight, 'image' )
    const canvasPainter: CanvasPixelPainter = new CanvasPixelPainter( canvas )
    const artist: GenModelArtist = new GenModelArtist( genModel, canvasPainter )
    regionMap.oldDirector( artist )
    const stream = fs.createWriteStream( fileName )
    const persister: CanvasPersister = new CanvasPersister( canvas, stream )
    await persister.finish()
  }
}
