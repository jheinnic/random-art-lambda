import { Chan } from "medium"

import { CliMainModuleConfiguration } from "./Configuration.js"
import { CliMainModuleTypes } from "./Types.js"

import {
   EnrollSourceFileCall,
   EnrollSourceFileReply,
} from "../../../plotting/protobuf/message/index.js"

import {
   RandomArtTaskCall,
   RandomArtTaskReply,
} from "../../../painting/message/index.js"
import { IRandomArtTaskEngine } from "../../../painting/interface/IRandomArtTaskEngine.js"

const unpackRandomArtTaskCallChannel = {
   provide: CliMainModuleTypes.RandomArtTaskCallChannel,
   useFactory: (config: CliMainModuleConfiguration): Chan<RandomArtTaskCall> =>
      config.randomArtTaskCallChannel,
   inject: [CliMainModuleTypes.ModuleConfiguration],
}

const unpackRandomArtTaskReplyChannel = {
   provide: CliMainModuleTypes.RandomArtTaskReplyChannel,
   useFactory: (config: CliMainModuleConfiguration): Chan<RandomArtTaskReply> =>
      config.randomArtTaskReplyChannel,
   inject: [CliMainModuleTypes.ModuleConfiguration],
}

const unpackEnrollSourceFileCallChannel = {
   provide: CliMainModuleTypes.EnrollSourceFileCallChannel,
   useFactory: (
      config: CliMainModuleConfiguration,
   ): Chan<EnrollSourceFileCall> => config.enrollSourceFileCallChannel,
   inject: [CliMainModuleTypes.ModuleConfiguration],
}

const unpackEnrollSourceFileReplyChannel = {
   provide: CliMainModuleTypes.EnrollSourceFileReplyChannel,
   useFactory: (
      config: CliMainModuleConfiguration,
   ): Chan<EnrollSourceFileReply> => config.enrollSourceFileReplyChannel,
   inject: [CliMainModuleTypes.ModuleConfiguration],
}

const unpackRandomArtEngine = {
   provide: CliMainModuleTypes.RandomArtTaskEngine,
   useFactory: (config: CliMainModuleConfiguration): IRandomArtTaskEngine =>
      config.randomArtTaskEngine,
   inject: [CliMainModuleTypes.ModuleConfiguration],
}

export const allProviders = [
   unpackEnrollSourceFileCallChannel,
   unpackEnrollSourceFileReplyChannel,
   unpackRandomArtTaskCallChannel,
   unpackRandomArtTaskReplyChannel,
   unpackRandomArtEngine,
]
