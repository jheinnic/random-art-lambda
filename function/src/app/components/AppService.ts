import { Inject, Injectable } from "@nestjs/common"

import { PaintingModuleTypes } from "../../painting/di/index.js"
import { IRandomArtTaskEngine, IRandomArtworkRepository } from "../../painting/interface/index.js"

@Injectable()
export class AppService {
  public constructor (
    @Inject(PaintingModuleTypes.IRandomArtworkRepository)
    private readonly repository: IRandomArtworkRepository,
    @Inject(PaintingModuleTypes.IRandomArtPainterFactory)
    private readonly factory: IRandomArtTaskEngine,
  ) { }

  public testRepo (): void {
    // const artTask = this.repository.create(
    //   "cidBits",
    //   Uint8Array.of(84, 81, 81, 190),
    //   Uint8Array.of(182, 81, 143, 94, 88, 104),
    // )
    console.log("Finished execute!")
  }
}
