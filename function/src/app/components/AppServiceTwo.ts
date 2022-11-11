import { Inject, Injectable } from "@nestjs/common"

import { PaintingModuleTypes } from "../../painting/di/index.js"
import { PlottingModuleTypes } from "../../plotting/di/index.js"
import { IRegionMapRepository } from "../../plotting/interface/IRegionMapRepository.js"

@Injectable()
export class AppServiceTwo {
  public constructor (
    @Inject(PlottingModuleTypes.IpldRegionMapRepository)
    private readonly repository: IRegionMapRepository
  ) { }

  public testRepo (): void {
    const artTask = this.repository.create(
      "cidBits",
      Uint8Array.of(84, 81, 81, 190),
      Uint8Array.of(182, 81, 143, 94, 88, 104)
    )
    console.log("Finished execute!")
  }
}
