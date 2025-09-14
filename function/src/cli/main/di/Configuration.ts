import {
   RandomArtTaskCall,
   RandomArtTaskReply,
} from "../../../painting/message/index.js"
import { ChannelWrapper } from "../../../channels/ChannelWrapper.js"
import { IRandomArtTaskEngine } from "../../../painting/index.js"
import { IpldRegionMapRepository } from "../../../plotting/ipld/components/IpldRegionMapRepository.js"

export class CliMainModuleConfiguration {
   constructor(
      public readonly randomArtTaskEngine: IRandomArtTaskEngine,
      public readonly regionMapRepository: IpldRegionMapRepository,
      public readonly randomArtTaskCallChannel: ChannelWrapper<RandomArtTaskCall>,
      public readonly randomArtTaskReplyChannel: ChannelWrapper<RandomArtTaskReply>,
   ) {}
}
