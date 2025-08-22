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
import { CliMainModule, CliMainModuleAsyncOptions } from "../main/di/Module.js"

import {
   EnrollSourceFileCall,
   EnrollSourceFileReply,
} from "../../plotting/protobuf/message/index.js"
import {
   RandomArtTaskCall,
   RandomArtTaskReply,
} from "../../painting/message/index.js"

export const cliChannelsModule = CliChannelsModule

const plottingModuleOptions: ProtobufPlottingModuleAsyncOptions = {
   imports: [cliChannelsModule],
   useFactory: (
      enrollSourceFileCallChannel: Chan<EnrollSourceFileCall>,
      enrollSourceFileReplyChannel: Chan<EnrollSourceFileReply>,
   ): ProtobufPlottingModuleConfiguration => {
      console.log({
         enrollSourceFileCallChannel,
         enrollSourceFileReplyChannel,
      })
      return {
         enrollSourceFileCallChannel,
         enrollSourceFileReplyChannel,
      }
   },
   inject: [
      CliChannelsModuleTypes.EnrollSourceFileCallChannel,
      CliChannelsModuleTypes.EnrollSourceFileReplyChannel,
   ],
}
export const plottingModule: DynamicModule =
   ProtobufPlottingModule.registerAsync(plottingModuleOptions)

const paintingModuleOptions: PaintingModuleAsyncOptions = {
   imports: [cliChannelsModule, plottingModule],
   useFactory: (
      regionMapRepo: IRegionMapRepository,
      randomArtTaskCallChannel: Chan<RandomArtTaskCall>,
      randomArtTaskReplyChannel: Chan<RandomArtTaskReply>,
   ): PaintingModuleConfiguration => {
      console.log({
         regionMapRepo,
         randomArtTaskCallChannel,
         randomArtTaskReplyChannel,
      })
      return {
         regionMapRepo,
         randomArtTaskCallChannel,
         randomArtTaskReplyChannel,
      }
   },
   inject: [
      PlottingModuleTypes.IRegionMapRepository,
      CliChannelsModuleTypes.RandomArtTaskCallChannel,
      CliChannelsModuleTypes.RandomArtTaskReplyChannel,
   ],
}

export const paintingModule: DynamicModule = PaintingModule.registerAsync(
   paintingModuleOptions,
)

const cliMainModuleAsyncOptions: CliMainModuleAsyncOptions = {
   imports: [cliChannelsModule, paintingModule],
   useFactory: (
      randomArtTaskEngine: IRandomArtTaskEngine,
      enrollSourceFileCallChannel: Chan<EnrollSourceFileCall>,
      enrollSourceFileReplyChannel: Chan<EnrollSourceFileReply>,
      randomArtTaskCallChannel: Chan<RandomArtTaskCall>,
      randomArtTaskReplyChannel: Chan<RandomArtTaskReply>,
   ): CliMainModuleConfiguration => {
      console.log({
         randomArtTaskEngine,
         randomArtTaskCallChannel,
         randomArtTaskReplyChannel,
         enrollSourceFileCallChannel,
         enrollSourceFileReplyChannel,
      })
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

export const cliMainModule = CliMainModule.registerAsync(
   cliMainModuleAsyncOptions,
)
