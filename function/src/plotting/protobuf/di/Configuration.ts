import { Chan } from "medium"
import {
   EnrollSourceFileCall,
   EnrollSourceFileReply,
} from "../message/index.js"

export class ProtobufPlottingModuleConfiguration {
   constructor(
      public readonly enrollSourceFileCallChannel: Chan<EnrollSourceFileCall>,
      public readonly enrollSourceFileReplyChannel: Chan<EnrollSourceFileReply>,
   ) {}
}
