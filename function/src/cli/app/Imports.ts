import { DynamicModule } from "@nestjs/common"
import { Blockstore } from "interface-blockstore"

import { CliChannelsModuleTypes } from "../../channels/Types.js"
import { CliChannelsModule } from "../../channels/Module.js"

import { PlottingModuleTypes } from "../../plotting/di/Types.js"
import { IRegionMapRepository } from "../../plotting/index.js"

import { PaintingModuleConfiguration } from "../../painting/di/Configuration.js"
import { PaintingModule } from "../../painting/di/Module.js"
import { RandomArtTaskEngine } from "../../painting/components/RandomArtTaskEngine.js"
import { IRandomArtTaskEngine } from "../../painting/interface/IRandomArtTaskEngine.js"

import { CliMainModuleConfiguration } from "../main/di/Configuration.js"
import { CliMainModuleAsyncOptions } from "../main/di/Module.js"

import {
   RandomArtTaskCall,
   RandomArtTaskReply,
} from "../../painting/message/index.js"
import { SharedBlockstoresModule } from "../../app/di/SharedBlockstoresModule.js"
import { SharedBlockstoresModuleTypes } from "../../app/di/SharedBlockstoresModuleTypes.js"
import { IpldPlottingModuleConfiguration } from "../../plotting/ipld/di/Configuration.js"
import { IpldPlottingModule } from "../../plotting/ipld/di/Module.js"

import { IpldRegionMapRepository } from "../../plotting/ipld/components/IpldRegionMapRepository.js"
import { ChannelWrapper } from "../../channels/ChannelWrapper.js"

export const plottingModule: DynamicModule = IpldPlottingModule.registerAsync({
   imports: [SharedBlockstoresModule],
   useFactory: (blockstore: Blockstore): IpldPlottingModuleConfiguration =>
      new IpldPlottingModuleConfiguration(blockstore),
   inject: [SharedBlockstoresModuleTypes.RegionMapBlockstore],
})

const paintingModuleOptions: PaintingModuleAsyncOptions = {
   imports: [CliChannelsModule, plottingModule],
   useFactory: (
      regionMapRepo: IRegionMapRepository,
      randomArtTaskCallChannel: ChannelWrapper<RandomArtTaskCall>,
      randomArtTaskReplyChannel: ChannelWrapper<RandomArtTaskReply>,
   ): PaintingModuleConfiguration => {
      return new PaintingModuleConfiguration(
         regionMapRepo,
         randomArtTaskCallChannel,
         randomArtTaskReplyChannel,
      )
   },
   inject: [
      PlottingModuleTypes.IRegionMapRepository,
      CliChannelsModuleTypes.RandomArtTaskCallChannel,
      CliChannelsModuleTypes.RandomArtTaskReplyChannel,
   ],
}

export const paintingModule: DynamicModule = PaintingModule.forRoot(
   plottingModule,
   PlottingModuleTypes.IRegionMapRepository,
   CliChannelsModule,
   CliChannelsModuleTypes.RandomArtTaskCallChannel,
   CliChannelsModule,
   CliChannelsModuleTypes.RandomArtTaskReplyChannel,
)

export const cliMainModuleAsyncOptions: CliMainModuleAsyncOptions = {
   imports: [CliChannelsModule, plottingModule, paintingModule],
   useFactory: (
      randomArtTaskEngine: IRandomArtTaskEngine,
      regionMapRepository: IpldRegionMapRepository,
      randomArtTaskCallChannel: ChannelWrapper<RandomArtTaskCall>,
      randomArtTaskReplyChannel: ChannelWrapper<RandomArtTaskReply>,
   ): CliMainModuleConfiguration => {
      return new CliMainModuleConfiguration(
         randomArtTaskEngine,
         regionMapRepository,
         randomArtTaskCallChannel,
         randomArtTaskReplyChannel,
      )
   },
   inject: [
      RandomArtTaskEngine,
      IpldRegionMapRepository,
      CliChannelsModuleTypes.RandomArtTaskCallChannel,
      CliChannelsModuleTypes.RandomArtTaskReplyChannel,
   ],
}
