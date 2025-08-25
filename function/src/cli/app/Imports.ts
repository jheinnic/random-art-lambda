import { DynamicModule } from "@nestjs/common"
import { Chan } from "medium"

import { CliChannelsModuleTypes } from "../channels/Types.js"
import { CliChannelsModule } from "../channels/Module.js"

import { PlottingModuleTypes } from "../../plotting/di/Types.js"
import { ProtobufPlottingModuleConfiguration } from "../../plotting/protobuf/di/Configuration.js"
import {
   ProtobufPlottingModule,
   ProtobufPlottingModuleAsyncOptions,
} from "../../plotting/protobuf/di/Module.js"
import { IRegionMapRepository } from "../../plotting/index.js"

import { PaintingModuleConfiguration } from "../../painting/di/Configuration.js"
import {
   PaintingModule,
   PaintingModuleAsyncOptions,
} from "../../painting/di/Module.js"
import { RandomArtTaskEngine } from "../../painting/components/RandomArtTaskEngine.js"
import { IRandomArtTaskEngine } from "../../painting/interface/IRandomArtTaskEngine.js"

import { CliMainModuleConfiguration } from "../main/di/Configuration.js"
import { CliMainModuleAsyncOptions } from "../main/di/Module.js"

import {
   EnrollSourceFileCall,
   EnrollSourceFileReply,
} from "../../plotting/protobuf/message/index.js"
import {
   RandomArtTaskCall,
   RandomArtTaskReply,
} from "../../painting/message/index.js"


const plottingModuleOptions: ProtobufPlottingModuleAsyncOptions = {
   imports: [CliChannelsModule],
   useFactory: (
      enrollSourceFileCallChannel: Chan<EnrollSourceFileCall>,
      enrollSourceFileReplyChannel: Chan<EnrollSourceFileReply>,
   ): ProtobufPlottingModuleConfiguration => {
      return new ProtobufPlottingModuleConfiguration(
         enrollSourceFileCallChannel,
         enrollSourceFileReplyChannel,
      )
   },
   inject: [
      CliChannelsModuleTypes.EnrollSourceFileCallChannel,
      CliChannelsModuleTypes.EnrollSourceFileReplyChannel,
   ],
}
const plottingModule: DynamicModule = ProtobufPlottingModule.registerAsync(
   plottingModuleOptions,
)

const paintingModuleOptions: PaintingModuleAsyncOptions = {
   imports: [CliChannelsModule, plottingModule],
   useFactory: (
      regionMapRepo: IRegionMapRepository,
      randomArtTaskCallChannel: Chan<RandomArtTaskCall>,
      randomArtTaskReplyChannel: Chan<RandomArtTaskReply>,
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

const paintingModule: DynamicModule = PaintingModule.registerAsync(
   paintingModuleOptions,
)

export const cliMainModuleAsyncOptions: CliMainModuleAsyncOptions = {
   imports: [CliChannelsModule, paintingModule],
   useFactory: (
      randomArtTaskEngine: IRandomArtTaskEngine,
      enrollSourceFileCallChannel: Chan<EnrollSourceFileCall>,
      enrollSourceFileReplyChannel: Chan<EnrollSourceFileReply>,
      randomArtTaskCallChannel: Chan<RandomArtTaskCall>,
      randomArtTaskReplyChannel: Chan<RandomArtTaskReply>,
   ): CliMainModuleConfiguration => {
      return new CliMainModuleConfiguration(
         randomArtTaskEngine,
         randomArtTaskCallChannel,
         randomArtTaskReplyChannel,
         enrollSourceFileCallChannel,
         enrollSourceFileReplyChannel,
      )
   },
   inject: [
      RandomArtTaskEngine,
      CliChannelsModuleTypes.EnrollSourceFileCallChannel,
      CliChannelsModuleTypes.EnrollSourceFileReplyChannel,
      CliChannelsModuleTypes.RandomArtTaskCallChannel,
      CliChannelsModuleTypes.RandomArtTaskReplyChannel,
   ],
}

