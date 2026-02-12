import { v4 as uuidv4 } from "uuid"

import { AsyncCallRequest } from "../../messages/interface/AsyncCallRequest.js"
import { Header } from "../../messages/interface/Header.js"
import { ReplyMessage } from "../../messages/interface/ReplyMessage.js"
import { ReplyMessageImpl } from "./ReplyMessageImpl.js"

export class AsyncCallRequestImpl<Content, Reply>
   implements AsyncCallRequest<Content, Reply>
{
   constructor(
      readonly messageId: string,
      readonly correlationId: string,
      readonly causationId: string,
      readonly timestamp: number,
      readonly headers: Header[],
      readonly payload: Content,
   ) {}

   static wrap<Content, Reply>(
      payload: Content,
      correlationId?: string,
      causationId?: string,
      headers?: Header[],
   ): AsyncCallRequest<Content, Reply> {
      const messageId = uuidv4()
      return new AsyncCallRequestImpl(
         messageId,
         correlationId ?? messageId,
         causationId ?? messageId,
         new Date().getTime(),
         headers ?? [],
         payload,
      )
   }

   prepareReply(content: Reply, headers?: Header[]): ReplyMessage<Reply> {
      return new ReplyMessageImpl(
         uuidv4(),
         this.correlationId,
         this.messageId,
         Date.now(),
         headers != null ? headers : [],
         "success",
         undefined,
         content,
      )
   }

   prepareError(content: string, headers?: Header[]): ReplyMessage<Reply> {
      return new ReplyMessageImpl(
         uuidv4(),
         this.correlationId,
         this.messageId,
         Date.now(),
         headers != null ? headers : [],
         "error",
         content,
         undefined,
      )
   }
}
