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
    private readonly regionMapRepo: IRegionMapRepository
  ) { }

  public async beginTask(request: RandomArtTaskRequest): Promise<IRandomArtwork> {
    const prefix = [ ...request.prefix ]
    const suffix = [ ...request.suffix ]

    const regionMap: IRegionMap = await this.regionMapRepo.load(request.regionMap)
    const genModel: GenModel = newPicture( prefix, suffix )
    const canvas: Canvas = new Canvas(regionMap.pixelWidth, regionMap.pixelHeight, 'image')
    const canvasPainter: IPixelPainter = new CanvasPixelPainter(canvas)
    const artist: GenModelArtist = new GenModelArtist(genModel, canvasPainter)

    return {

    };
  }
}
