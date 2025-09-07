import { Chan } from "medium"

import { PlottingModuleTypes } from "../../di/Types.js"
import { ProtobufPlottingModuleTypes } from "./Types.js"

import { PBufRegionMapRepository } from "../components/PBufRegionMapRepository.js"
import { ProtobufPlottingModuleConfiguration } from "./Configuration.js"
import {
   EnrollSourceFileCall,
   EnrollSourceFileReply,
} from "../message/index.js"

export const regionMapRepositoryAlias = {
   provide: PlottingModuleTypes.IRegionMapRepository,
   useExisting: PBufRegionMapRepository,
}

export const unpackConfiguredCallChannel = {
   provide: ProtobufPlottingModuleTypes.EnrollSourceFileCallChannel,
   useFactory: (
      config: ProtobufPlottingModuleConfiguration,
   ): Chan<EnrollSourceFileCall> => {
      console.log("Unpacking: ", JSON.stringify(config))
      return config.enrollSourceFileCallChannel
   },
   inject: [ProtobufPlottingModuleTypes.ModuleConfiguration],
}

export const unpackConfiguredReplyChannel = {
   provide: ProtobufPlottingModuleTypes.EnrollSourceFileReplyChannel,
   useFactory: (
      config: ProtobufPlottingModuleConfiguration,
   ): Chan<EnrollSourceFileReply> => config.enrollSourceFileReplyChannel,
   inject: [ProtobufPlottingModuleTypes.ModuleConfiguration],
}
