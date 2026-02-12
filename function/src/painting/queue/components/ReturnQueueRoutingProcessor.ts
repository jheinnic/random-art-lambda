import { Logger } from "@nestjs/common"
import { Processor, WorkerHost } from "@nestjs/bullmq"
import { finalize, Observable, Subject } from "rxjs"
import { v4 as uuidv4 } from "uuid"
import { Job } from "bullmq"

// TODO: Define proper message types in messages/interface
// import { ReplyRoutingResult } from "../messages/ReplyRoutingResult._st"
interface RemoteRequest<Req, _Rep> {
   causationId: string
   correlationId: string
   messageId: string
   replyOn: string
   payload: Req
}
interface ReplyMessage<Rep> {
   causationId: string
   correlationId: string
   messageId: string
   timestamp: number
   status: "success" | "error"
   payload?: Rep
   error?: Error
   headers?: Record<string, string> | never[]
}

@Processor(`reply-queue-${process.env.UNIQUE_ID ?? "xyz"}`)
export class ReturnQueueRoutingProcessor<Request, Reply> extends WorkerHost {
   causationMap: Map<string, Subject<any>> = new Map()
   logger: Logger

   constructor() {
      super()
      this.logger = new Logger("ReturnQueueRoutingProcessor")
   }

   registerPendingRequest(
      requestMessage: RemoteRequest<Request, Reply>,
      timeout: number,
   ): Observable<ReplyMessage<Reply>> {
      if (requestMessage.replyOn === undefined) {
         throw new Error(
            `Request message is being made with an undefined replyOn queue name, not ${this.worker.name}`,
         )
      } else if (requestMessage.replyOn !== this.worker.name) {
         throw new Error(
            `Request message is not being made with ${requestMessage.replyOn} as its replyOn queue name, not ${this.worker.name}`,
         )
      }
      const subject = new Subject<any>()

      const requestMessageId = requestMessage.messageId
      this.causationMap.set(requestMessageId, subject)

      // Timer owned by processor
      const timeoutHandle = setTimeout(() => {
         if (this.causationMap.has(requestMessageId)) {
            subject.error({
               messageId: uuidv4(),
               correlationId: requestMessage.correlationId,
               causationId: requestMessage.messageId,
               timestamp: new Date().getTime(),
               status: "error",
               error: `Response not received after ${timeout}`,
            })
            this.causationMap.delete(requestMessageId)
         }
      }, timeout)

      // Return subject with cleanup baked in
      return subject.pipe(
         finalize(() => {
            clearTimeout(timeoutHandle)
            this.causationMap.delete(requestMessageId)
         }),
      )
   }

   // TODO: Rethink the return type here!
   async process(
      job: Job<ReplyMessage<Reply>, any>,
   ): Promise<any> {
      const {
         causationId,
         status,
         correlationId,
         messageId,
         timestamp,
         payload,
         error,
      } = job.data

      if (causationId !== undefined) {
         const pending: Subject<ReplyMessage<Reply>> | undefined =
            this.causationMap.get(causationId)

         if (pending === undefined) {
            // Already timed out or cleaned up
            this.logger.warn(
               `No pending request for causation == ${causationId}: ${JSON.stringify(job)}`,
            )
            return {
               delivered: false,
               recipientFound: false,
               causationId,
               correlationId,
               messageId,
               headers: [],
               timestamp,
               status,
               error,
            }
         }

         // Clear the timeout since response arrived
         try {
            if (status === "error") {
               // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
               // pending.error(new Error(error!))
               pending.error({
                  messageId,
                  correlationId,
                  causationId,
                  timestamp,
                  status,
                  payload,
                  error,
               })
            } else {
               pending.next({
                  messageId,
                  correlationId,
                  causationId,
                  timestamp,
                  headers: [],
                  status,
                  payload,
               })
               pending.complete()
            }
         } finally {
            this.causationMap.delete(causationId)
         }
      }

      return {
         delivered: true,
         correlationId,
         messageId,
         causationId,
         timestamp,
         headers: [],
         status,
         error,
      }
   }
}
