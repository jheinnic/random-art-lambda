import { DynamicModule, Module } from "@nestjs/common"
import { Blockstore } from "interface-blockstore"

import { IpldPlottingModule } from "../../plotting/ipld/di/Module.js"
import { IpldPlottingModuleConfiguration } from "../../plotting/ipld/di/Configuration.js"
// import { PaintingModule } from "../../painting/di/Module.js"
import { AppService } from "../components/AppService.js"
import { AppServiceTwo } from "../components/AppServiceTwo.js"
import { SharedBlockstoresModule } from "./SharedBlockstoresModule.js"
import { SharedBlockstoresModuleTypes } from "./SharedBlockstoresModuleTypes.js"
import { ProtobufPlottingModule } from "../../plotting/protobuf/di/Module.js"
import { SeedingModule } from "../../seeding/di/Module.js"
import { BuiltInGenModelSeedingModule } from "../../seeding/builtin/di/Module.js"
import {
   CliChannelsModule,
   CliChannelsModuleTypes,
} from "../../channels/index.js"
import { PaintingModule } from "../../painting/di/Module.js"
import { PlottingModuleTypes } from "../../plotting/di/Types.js"
import { SeedingModuleTypes } from "../../seeding/di/Types.js"

export const plottingModule: DynamicModule = IpldPlottingModule.registerAsync({
   imports: [SharedBlockstoresModule],
   useFactory: (blockstore: Blockstore): IpldPlottingModuleConfiguration =>
      new IpldPlottingModuleConfiguration(blockstore),
   inject: [SharedBlockstoresModuleTypes.RegionMapBlockstore],
})

const paintingModule: DynamicModule = PaintingModule.forRoot({
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
   GMSeedExtPoint: {
      use: "token",
      for: "value",
      module: SeedingModule,
      token: SeedingModuleTypes.GMSeedExtensionPoint,
   },
})

@Module({
   imports: [
      SharedBlockstoresModule,
      plottingModule,
      ProtobufPlottingModule,
      SeedingModule,
      BuiltInGenModelSeedingModule,
      // paintingModule,
   ],
   providers: [AppService, AppServiceTwo],
   exports: [AppServiceTwo, AppService, IpldPlottingModule], //, paintingModule],
})
export class AppModule {}
