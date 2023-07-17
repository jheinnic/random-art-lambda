import * as fs from "fs"
import { CID } from "multiformats"
import { Inject, Injectable } from "@nestjs/common"
import { Canvas } from "canvas"

import { PlottingModuleTypes } from "../../plotting/di/index.js"
import { IRegionMap, IRegionMapRepository } from "../../plotting/interface/index.js"
import { IPixelPainter, IRandomArtwork, IRandomArtTaskEngine, RandomArtTaskRequest } from "../interface/index.js"
import { CanvasPixelPainter } from './CanvasPixelPainter.js'
import { GenModelArtist } from './GenModelArtist.js'
import { GenModel, newPicture } from "./genjs6.js"

@Injectable()
export class RandomArtTaskEngine implements IRandomArtTaskEngine {
  public constructor (
    @Inject( PlottingModuleTypes.IRegionMapRepository )
    private readonly RegionMapRepository: IRegionMapRepository
  ) { }

  public async beginTask( request: RandomArtTaskRequest ): Promise<IRandomArtwork> {
    const prefix = [ ...request.prefix ]
    const suffix = [ ...request.suffix ]

    const regionMap: IRegionMap = await this.RegionMapRepository.load( request.regionMap )
    const genModel: GenModel = newPicture( prefix, suffix )
    const canvas: Canvas = new Canvas( regionMap.pixelWidth, regionMap.pixelHeight, 'image' )
    const canvasPainter: IPixelPainter = new CanvasPixelPainter( canvas )
    const artist: GenModelArtist = new GenModelArtist( genModel, canvasPainter )

    const cid1 = CID.parse( 'QmXPV4uU34qMVnj3DhQFT1s1766eFK8y95DE7oFZvrbbZ3' )
    const cid2 = CID.parse( 'QmQ9LT1MW4jfFbettuP7T9qxpNYDBfahvetf8y4ZqbiAtw' )

    return {
      cid: cid1,
      prefix: Uint8Array.from( [ 84, 81, 81, 190 ] ),
      suffix: Uint8Array.from( [ 182, 81, 143, 94, 88, 104 ] ),
      regionMap: cid2,
      engineVersion: '0.0.1',
      buffer: Buffer.from( [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ] ),
      stream: fs.createReadStream( 'fdoc.proto' )
    }
  }
}
