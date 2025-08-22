import { Inject, Injectable } from "@nestjs/common"

import { PlottingModuleTypes } from "../../plotting/di/Types.js"
// import { PaintingModuleTypes } from "../../painting/di/Types.js"
// import { IRandomArtTaskEngine } from "../../painting/interface/index.js"
import { IRegionMapRepository } from "../../plotting/interface"

@Injectable()
export class AppService {
   public constructor(
      @Inject(PlottingModuleTypes.IRegionMapRepository)
      private readonly mapRepo: IRegionMapRepository,
      // @Inject( PaintingModuleTypes.IRandomArtTaskEngine )
      // private readonly engine: IRandomArtTaskEngine,
      // @Inject( PaintingModuleTypes.IRandomArtworkRepositoryworkRepository )
      // private readonly repository: IRandomArt,
      // @Inject( PaintingModuleTypes.IRandomArtPainterFactory )
      // private readonly factory: IRandomArtTaskEngine,
   ) {}

   public testRepo(): void {
      // const artTask = this.repository.create(
      //   "cidBits",
      //   Uint8Array.of(84, 81, 81, 190),
      //   Uint8Array.of(182, 81, 143, 94, 88, 104),
      // )
      console.log("Finished execute!")
   }

   public testCommand(): void {
      console.log("Finish him!")
   }
}
