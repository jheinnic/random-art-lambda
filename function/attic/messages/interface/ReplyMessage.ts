import { Message } from "./Message.js"

export interface ReplyMessage<Content> extends Message<Content> {
   status: "success" | "error"
   error?: string | null
}
