import { Chan } from "medium"
import {
   RandomArtTaskCall,
   RandomArtTaskReply,
} from "../../../painting/message/index.js"
import { IRandomArtTaskEngine } from "../../../painting/index.js"
import {
   EnrollSourceFileCall,
   EnrollSourceFileReply,
} from "../../../plotting/protobuf/message/index.js"
// export interface CliMainModuleConfiguration {
//    readonly randomArtTaskEngine: IRandomArtTaskEngine
//    readonly randomArtTaskCallChannel: Chan<RandomArtTaskCall>
//    readonly randomArtTaskReplyChannel: Chan<RandomArtTaskReply>
//    readonly enrollSourceFileCallChannel: Chan<EnrollSourceFileCall>
//    readonly enrollSourceFileReplyChannel: Chan<EnrollSourceFileReply>
// }

export class CliMainModuleConfiguration {
   constructor(
      public readonly randomArtTaskEngine: IRandomArtTaskEngine,
      public readonly randomArtTaskCallChannel: Chan<RandomArtTaskCall>,
      public readonly randomArtTaskReplyChannel: Chan<RandomArtTaskReply>,
      public readonly enrollSourceFileCallChannel: Chan<EnrollSourceFileCall>,
      public readonly enrollSourceFileReplyChannel: Chan<EnrollSourceFileReply>,
   ) {}
}
