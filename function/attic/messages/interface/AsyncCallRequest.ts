import { Header } from "./Header.js"
import { Message } from "./Message.js"
import { ReplyMessage } from "./ReplyMessage.js"

export interface AsyncCallRequest<Content, Reply> extends Message<Content> {
   // replyOn?: Subject<ReplyMessage<Reply>>
   prepareReply: (content: Reply, headers?: Header[]) => ReplyMessage<Reply>
   prepareError: (content: string, headers?: Header[]) => ReplyMessage<Reply>
}
