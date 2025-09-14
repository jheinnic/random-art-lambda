// import { InjectionToken } from "@nestjs/common"
import { ChannelWrapper } from "../../channels/ChannelWrapper.js"
import { IRegionMapRepository } from "../../plotting/interface/index.js"
import { RandomArtTaskCall } from "../message/RandomArtTaskCall.js"
import { RandomArtTaskReply } from "../message/RandomArtTaskReply.js"

/**
 * Paint Module is configurable by varying the implementation of the
 * repository it uses to fetch IRegionMaps fo:r the CID in a request object.
 */

export class PaintingModuleConfiguration {
   constructor(
      public readonly regionMapRepo: IRegionMapRepository,
      public readonly randomArtTaskCallChannel: ChannelWrapper<RandomArtTaskCall>,
      public readonly randomArtTaskReplyChannel: ChannelWrapper<RandomArtTaskReply>,
   ) {}
}
