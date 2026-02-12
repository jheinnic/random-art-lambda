import { Message } from "./Message.js"

export interface RemoteRequest<Content, _Reply> extends Message<Content> {
   sendOn: string
   replyOn?: string
}
