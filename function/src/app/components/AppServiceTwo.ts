import { Inject, Injectable } from "@nestjs/common"
import { CID } from "multiformats"

import { PaintingModuleTypes } from "../../painting/di/index.js"
import { PlottingModuleTypes } from "../../plotting/di/index.js"
import { IRandomArtworkRepository } from "../../painting/interface/index.js"
import { IRegionMapRepository, IRegionMap } from "../../plotting/interface/index.js"

@Injectable()
export class AppServiceTwo {
  private readonly cidCache: Map<CID, IRegionMap> = new Map()

  public constructor (
    @Inject(PlottingModuleTypes.IRegionMapRepository)
    private readonly mapRepo: IRegionMapRepository,
    @Inject(PaintingModuleTypes.IRandomArtworkRepository)
    private readonly taskRepo: IRandomArtworkRepository,
  ) { }

  public async testRepo (cid: CID, prefix: Uint8Array, suffix: Uint8Array): Promise<void> {
    if (!this.cidCache.has(cid)) {
      await this.mapRepo.load(cid).then((loadedMap) => {
        if (!this.cidCache.has(cid)) {
          this.cidCache.set(cid, loadedMap)
        }
      })
    }
    const resourceMap = this.cidCache.get(cid)
    const artTask = this.taskRepo.create(
      cid,
      Uint8Array.of(84, 81, 81, 190),
      Uint8Array.of(182, 81, 143, 94, 88, 104),
    )
    console.log("Finished execute!")
  }
}
