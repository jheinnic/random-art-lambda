import { Logger } from "@nestjs/common"
import { Observable } from "rxjs"

import { ReplyMessage, Message } from "../../messages/interface/index.js"

export interface IRxLocalCallChannel<Request, Reply> {
   call: ((
      value: Request,
      correlationId: string,
      causationId: string,
   ) => Observable<ReplyMessage<Reply>>) &
      ((value: Request | Message<Request>) => Observable<ReplyMessage<Reply>>) &
      ((
         value: Request | Message<Request>,
         correlationId?: string,
         causationId?: string,
      ) => Observable<ReplyMessage<Reply>>)

   registerHandler: (
      handler: (request: Request, logger: Logger) => Promise<Reply>,
   ) => void

   close: () => void
}
