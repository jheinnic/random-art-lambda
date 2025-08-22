import { Chan } from "medium"
import {
   EnrollSourceFileCall,
   EnrollSourceFileReply,
} from "../message/index.js"
export interface ProtobufPlottingModuleConfiguration {
   readonly enrollSourceFileCallChannel: Chan<EnrollSourceFileCall>
   readonly enrollSourceFileReplyChannel: Chan<EnrollSourceFileReply>
}
