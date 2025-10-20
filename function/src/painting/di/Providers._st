import { Chan } from "medium"

import { PaintingModuleTypes } from "./Types.js"
import { PaintingModuleConfiguration } from "./Configuration.js"
import { RandomArtTaskCall, RandomArtTaskReply } from "../message/index.js"
import { IRegionMapRepository } from "../../plotting/interface/IRegionMapRepository.js"

export const unpackConfiguredRegionMapRepository = {
   provide: PaintingModuleTypes.InjectedRegionMapRepository,
   useFactory: (config: PaintingModuleConfiguration): IRegionMapRepository =>
      config.regionMapRepo,
   inject: [PaintingModuleTypes.ModuleConfiguration],
}

export const unpackConfiguredCallChannel = {
   provide: PaintingModuleTypes.RandomArtTaskCallChannel,
   useFactory: (config: PaintingModuleConfiguration): Chan<RandomArtTaskCall> =>
      config.randomArtTaskCallChannel,
   inject: [PaintingModuleTypes.ModuleConfiguration],
}

export const unpackConfiguredReplyChannel = {
   provide: PaintingModuleTypes.RandomArtTaskReplyChannel,
   useFactory: (
      config: PaintingModuleConfiguration,
   ): Chan<RandomArtTaskReply> => config.randomArtTaskReplyChannel,
   inject: [PaintingModuleTypes.ModuleConfiguration],
}
