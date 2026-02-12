import { ReplyMessage } from "../../../messages/interface/index.js"

export interface ReplyRoutingResult
   extends Omit<ReplyMessage<object>, "payload"> {
   recipientFound?: false
   delivered: boolean
}
