import { Header } from "../../messages/interface/Header.js"
import { ReplyMessage } from "../../messages/interface/index.js"

export class ReplyMessageImpl<Reply> implements ReplyMessage<Reply> {
   constructor(
      readonly messageId: string,
      readonly correlationId: string,
      readonly causationId: string,
      readonly timestamp: number,
      readonly headers: Header[],
      readonly status: "success" | "error",
      readonly error?: string | null | undefined,
      readonly payload?: Reply | undefined,
   ) {}
}
