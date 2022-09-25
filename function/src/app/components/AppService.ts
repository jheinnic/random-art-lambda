import { Injectable } from "@nestjs/common"

import { PaintingModuleTypes } from "../../painting/di/typez"
import { IRandomArtTaskRepository } from "../../painting/interface/IRandomArtTaskRepository.js"

@Injectable()
export class AppService {
  public constructor (
    @Inject(PaintingModuleTypes.RandomArtTaskRepository)
    private readonly repository: IRandomArtTaskRepository,
    @Inject(PaintingModuleTypes.Rand)
    private readonly factory: IRandomArtFactory
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
