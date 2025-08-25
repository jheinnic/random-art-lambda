import {
   RandomArtTaskCall,
   RandomArtTaskReply,
} from "../../../painting/message/index.js"
import {
   EnrollSourceFileCall,
   EnrollSourceFileReply,
} from "../../../plotting/protobuf/message/index.js"
import { ChannelWrapper } from "../../channels/ChannelWrapper.js"
import { IRandomArtTaskEngine } from "../../../painting/index.js"

export class CliMainModuleConfiguration {
   constructor(
      public readonly randomArtTaskEngine: IRandomArtTaskEngine,
      public readonly randomArtTaskCallChannel: ChannelWrapper<RandomArtTaskCall>,
      public readonly randomArtTaskReplyChannel: ChannelWrapper<RandomArtTaskReply>,
      public readonly enrollSourceFileCallChannel: ChannelWrapper<EnrollSourceFileCall>,
      public readonly enrollSourceFileReplyChannel: ChannelWrapper<EnrollSourceFileReply>,
   ) {}
}
