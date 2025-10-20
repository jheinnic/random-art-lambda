import { Chan } from "medium"

import { CliMainModuleConfiguration } from "./Configuration.js"
import { CliMainModuleTypes } from "./Types.js"

import {
   RandomArtTaskCall,
   RandomArtTaskReply,
} from "../../../painting/message/index.js"
import { IRandomArtTaskEngine } from "../../../painting/interface/IRandomArtTaskEngine.js"
import { IpldRegionMapRepository } from "../../../plotting/ipld/components/IpldRegionMapRepository.js"

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

const unpackRegionMapRepository = {
   provide: CliMainModuleTypes.RegionMapRepository,
   useFactory: (config: CliMainModuleConfiguration): IpldRegionMapRepository =>
      config.regionMapRepository,
   inject: [CliMainModuleTypes.ModuleConfiguration],
}

const unpackRandomArtEngine = {
   provide: CliMainModuleTypes.RandomArtTaskEngine,
   useFactory: (config: CliMainModuleConfiguration): IRandomArtTaskEngine =>
      config.randomArtTaskEngine,
   inject: [CliMainModuleTypes.ModuleConfiguration],
}

export const allProviders = [
   unpackRandomArtTaskCallChannel,
   unpackRandomArtTaskReplyChannel,
   unpackRegionMapRepository,
   unpackRandomArtEngine,
]
