import { v4 as uuidv4 } from "uuid"

import { AsyncCallRequest } from "../../messages/interface/AsyncCallRequest.js"
import { Header } from "../../messages/interface/Header.js"
import { ReplyMessage } from "../../messages/interface/ReplyMessage.js"
import { ScatterGatherTask } from "../../messages/interface/ScatterGatherTask.js"

export class ScatterGatherTaskImpl<Request, SubTask, SubResult, Result>
   implements ScatterGatherTask<Request, SubTask, SubResult, Result>
{
   constructor(
      readonly messageId: string,
      readonly correlationId: string,
      readonly causationId: string,
      readonly timestamp: number,
      readonly headers: Header[],
      readonly payload?: Request | undefined,
   ) {}

   static wrap<Task, SubTask, SubResult, Result>(
      payload: Task,
      correlationId?: string,
      causationId?: string,
      headers?: Header[],
   ): ScatterGatherTask<Task, SubTask, SubResult, Result> {
      const messageId = uuidv4()
      return new ScatterGatherTaskImpl(
         messageId,
         correlationId ?? messageId,
         causationId ?? messageId,
         new Date().getTime(),
         headers ?? [],
         payload,
      )
   }

   scatter(content: SubTask[]): Array<AsyncCallRequest<SubTask, SubResult>> {
      throw new Error("Not implemented")
   }

   gather(content: Result): ReplyMessage<Result> {
      throw new Error("Not implemented")
   }
}
