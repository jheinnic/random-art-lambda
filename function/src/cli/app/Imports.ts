import { DynamicModule } from "@nestjs/common"
import { Blockstore } from "interface-blockstore"

import { CliChannelsModuleTypes } from "../../channels/Types.js"
import { SharedBlockstoresModuleTypes } from "../../app/di/SharedBlockstoresModuleTypes.js"
import { PlottingModuleTypes } from "../../plotting/di/Types.js"
import { IpldPlottingModuleConfiguration } from "../../plotting/ipld/di/Configuration.js"

import { CliChannelsModule } from "../../channels/Module.js"
import { SharedBlockstoresModule } from "../../app/di/SharedBlockstoresModule.js"
import { IpldPlottingModule } from "../../plotting/ipld/di/Module.js"
import { PaintingModule } from "../../painting/di/Module.js"

export const plottingModule: DynamicModule = IpldPlottingModule.registerAsync({
   imports: [SharedBlockstoresModule],
   useFactory: (blockstore: Blockstore): IpldPlottingModuleConfiguration =>
      new IpldPlottingModuleConfiguration(blockstore),
   inject: [SharedBlockstoresModuleTypes.RegionMapBlockstore],
})

export const paintingModule: DynamicModule = PaintingModule.forRoot({
   regionMapRepo: {
      use: "token",
      for: "value",
      module: plottingModule,
      token: PlottingModuleTypes.IRegionMapRepository,
   },
   taskCallChannel: {
      use: "token",
      for: "value",
      module: CliChannelsModule,
      token: CliChannelsModuleTypes.RandomArtTaskCallChannel,
   },
   taskReplyChannel: {
      use: "token",
      for: "value",
      module: CliChannelsModule,
      token: CliChannelsModuleTypes.RandomArtTaskReplyChannel,
   },
})
