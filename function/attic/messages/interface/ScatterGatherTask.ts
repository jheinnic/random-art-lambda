import { AsyncCallRequest } from "./AsyncCallRequest.js"
import { Message } from "./Message.js"
import { ReplyMessage } from "./ReplyMessage.js"

export interface ScatterGatherTask<
   Content,
   PartialTask,
   PartialResult,
   CombinedResult,
> extends Message<Content> {
   // replyOn?: Subject<ReplyMessage<Reply>>
   scatter: (
      content: PartialTask[],
   ) => Array<AsyncCallRequest<PartialTask, PartialResult>>
   gather: (content: CombinedResult) => ReplyMessage<CombinedResult>
}
