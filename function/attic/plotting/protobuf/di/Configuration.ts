import { ChannelWrapper } from "../../../channels/ChannelWrapper.js"
import {
   EnrollSourceFileCall,
   EnrollSourceFileReply,
} from "../message/index.js"

export class ProtobufPlottingModuleConfiguration {
   constructor(
      public readonly enrollSourceFileCallChannel: ChannelWrapper<EnrollSourceFileCall>,
      public readonly enrollSourceFileReplyChannel: ChannelWrapper<EnrollSourceFileReply>,
   ) {}
}
