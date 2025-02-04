import { Inject, Injectable } from "@nestjs/common"
import { CID } from "multiformats"
import { Canvas } from "canvas"
import { sha256 as hasher } from "multiformats/hashes/sha2"
import * as fs from "fs"

import { PaintingModuleTypes } from "../../painting/di/index.js"
import { PlottingModuleTypes } from "../../plotting/di/index.js"
import { IRandomArtworkRepository, IRandomArtTaskEngine, IPixelPainter } from "../../painting/interface/index.js"
import { IRegionMapRepository, IRegionMap } from "../../plotting/interface/index.js"
import { PBufAdapterFactory } from "../../plotting/protobuf/PBufAdapterFactory.js"
import { CanvasPixelPainter } from "../../painting/components/CanvasPixelPainter.js"
import { CanvasPersister } from "../../painting/components/CanvasPersister.js"
import { GenModelArtist } from "../../painting/components/GenModelArtist.js"
import { GenModel, newPicture } from "../../painting/components/genjs6.js"
import { PBufAdapter } from "../../plotting/protobuf/PBufAdapter.js"

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

  public async testRun1(): Promise<void> {
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
      await this.doOne( prefix, suffix, regionMap, fileName )
    }
  }

  public async testRun(): Promise<void> {
    const workList: { prefix: string, suffix: string }[] =
      JSON.parse( fs.readFileSync( "source.list" ).toString() )
    const adapters: PBufAdapter[] = [
      this.adapterFactory.adapt( "./qdoc4.proto" ),
      this.adapterFactory.adapt( "./qdoc5.proto" ),
      this.adapterFactory.adapt( "./qdoc6.proto" )
    ]

    const regionMaps: IRegionMap[] = [
      adapters[ 0 ].asRegionMap(), adapters[ 1 ].asRegionMap(), adapters[ 2 ].asRegionMap()
    ]
    const regions: { name: string, regionMap: IRegionMap }[] = [
      { regionMap: regionMaps[ 0 ], name: "qdoc4" },
      { regionMap: regionMaps[ 1 ], name: "qdoc5" },
      { regionMap: regionMaps[ 2 ], name: "qdoc6" },
    ]

    let task: { prefix: string, suffix: string }
    let region: { name: string, regionMap: IRegionMap }

    for ( task of workList ) {
      let buf: Buffer = Buffer.from( task.prefix, "hex" )
      const prefix: Uint8Array = Uint8Array.from( buf )
      buf = Buffer.from( task.suffix, "hex" )
      const suffix: Uint8Array = Uint8Array.from( buf )

      await Promise.all(
        regions.map( ( region ) => {
          const fileName = `./${ region.name }/${ task.prefix }_${ task.suffix }.png`
          return this.doOne( prefix, suffix, region.regionMap, fileName )
        } )
      )
    }
  }

  private async doOne( prefix: Uint8Array, suffix: Uint8Array, regionMap: IRegionMap, fileName: string ) {
    const genModel: GenModel = newPicture( [ ...prefix ], [ ...suffix ] )
    const canvas: Canvas = new Canvas( regionMap.pixelWidth, regionMap.pixelHeight, 'image' )
    const canvasPainter: CanvasPixelPainter = new CanvasPixelPainter( canvas )
    const artist: GenModelArtist = new GenModelArtist( genModel, canvasPainter )
    regionMap.oldDirector( artist )
    const stream = fs.createWriteStream( fileName )
    const persister: CanvasPersister = new CanvasPersister( canvas, stream )
    await persister.finish()
    console.log( fileName )
  }
}