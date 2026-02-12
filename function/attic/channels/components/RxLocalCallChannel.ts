import {
   Inject,
   Injectable,
   Logger,
   OnApplicationBootstrap,
} from "@nestjs/common"
import { Subject, Observable, Subscription, merge } from "rxjs"
import { concatMap, takeUntil, finalize, mergeMap, tap } from "rxjs/operators"
import { v4 as uuidv4 } from "uuid"

import {
   AsyncCallRequest,
   ReplyMessage,
   Message,
   isMessage,
} from "../../messages/interface/index.js"
import { ChannelsModuleTypes } from "../di/Types.js"
import {
   IRxLocalCallChannel,
   RxLocalCallChannelConfig,
} from "../interface/index.js"
import { AsyncCallRequestImpl } from "./AsyncCallRequestImpl.js"

// 1. Replace ChannelWrapper with RxChannel
// =========================================

/**
 * Drop-in replacement for your ChannelWrapper
 * Provides Chan-like semantics using RxJS
 */
@Injectable()
export class RxLocalCallChannel<Request, Reply>
   implements IRxLocalCallChannel<Request, Reply>, OnApplicationBootstrap
{
   private readonly subject: Subject<AsyncCallRequest<Request, Reply>>
   private readonly source: Observable<AsyncCallRequest<Request, Reply>>
   private subscription?: Subscription
   private readonly activate$: Subject<void> = new Subject<void>()
   private readonly destroy$: Subject<void> = new Subject<void>()
   private isActivated: boolean = false
   private readonly logger: Logger = new Logger("RxLocalCallChannel")
   private readonly causationMap: Map<string, Subject<ReplyMessage<Reply>>> =
      new Map()

   constructor(
      @Inject(ChannelsModuleTypes.RxLocalCallChannelConfig)
      private readonly config: RxLocalCallChannelConfig,
      @Inject(ChannelsModuleTypes.RepliesChannel)
      private readonly replies: Subject<ReplyMessage<Reply>>,
   ) {
      this.subject = new Subject<AsyncCallRequest<Request, Reply>>()
      this.source = this.activate$.pipe(
         tap((x) => {
            this.logger.log("Tap observes a next from activate$")
         }),
         concatMap(() => this.subject.pipe(takeUntil(this.destroy$))),
      )
   }

   // Replaces: put(channel, value)
   call(
      value: Request,
      correlationId: string,
      causationId: string,
   ): Observable<ReplyMessage<Reply>>
   call(value: Request | Message<Request>): Observable<ReplyMessage<Reply>>
   call(
      value: Request | Message<Request>,
      correlationId?: string,
      causationId?: string,
   ): Observable<ReplyMessage<Reply>> {
      if (!this.isActivated) {
         this.logger.error("Not yet activated!")
         throw new Error("Not yet activated!")
      }

      const replyOn = new Subject<ReplyMessage<Reply>>()
      let retVal = replyOn.asObservable()
      if (this.config.timeout !== undefined) {
         const useTimeout: number = this.config.timeout
         const timeoutHandle = setTimeout(() => {
            this.logger.error("Timeout operator has fired!")
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            replyOn.error(`Response not received after ${useTimeout}`)
         }, useTimeout)

         // Return subject with cleanup baked in
         retVal = replyOn.pipe(
            finalize(() => {
               clearTimeout(timeoutHandle)
            }),
         )
      }

      if (isMessage(value)) {
         this.logger.log(
            `Sending ${JSON.stringify(value)} with existing headers`,
         )
         this.causationMap.set(value.messageId, replyOn)
         this.subject.next(value as AsyncCallRequest<Request, Reply>)
      } else if (correlationId !== undefined && causationId !== undefined) {
         const nextValue = {
            messageId: uuidv4(),
            correlationId,
            causationId,
            timestamp: new Date().getTime(),
            payload: value,
            // replyOn,
         }
         this.logger.log(
            `Sending ${JSON.stringify(nextValue)} to outbound subject`,
         )
         this.causationMap.set(nextValue.messageId, replyOn)
         this.subject.next(nextValue as AsyncCallRequest<Request, Reply>)
      } else {
         const messageId = uuidv4()
         const nextValue = new AsyncCallRequestImpl<Request, Reply>(
            messageId,
            messageId,
            messageId,
            new Date().getTime(),
            [],
            value,
         )
         // replyOn,
         this.logger.log(
            `Sending ${JSON.stringify(nextValue)} to outbound subject`,
         )
         this.causationMap.set(nextValue.messageId, replyOn)
         this.subject.next(nextValue)
      }

      return retVal
   }

   registerHandler(
      handler: (x: Request, logger: Logger) => Promise<Reply>,
   ): void {
      if (this.isActivated) {
         throw new Error("Already activated!")
      }
      if (this.subscription !== undefined) {
         throw new Error("Handler already registered")
      }

      this.subscription = merge(
         this.source.pipe(
            mergeMap(async (x: AsyncCallRequest<Request, Reply>) => {
               const logger: Logger = new Logger(
                  `MessageHandler<${x.messageId}>`,
               )
               logger.log("Incoming MergeMap is forking an Observable for:", x)

               let replyMessage: ReplyMessage<Reply>
               if (x.payload !== undefined) {
                  logger.log(
                     "About to call handler with this logger and ",
                     x.payload,
                  )
                  try {
                     const reply: Awaited<Reply> = await handler(
                        x.payload,
                        logger,
                     )
                     logger.log("Handler replied with ", reply)

                     replyMessage = x.prepareReply(reply)
                  } catch (err: any) {
                     logger.error(
                        `Failed to handle msgId=${x.messageId}, correlation=${x.correlationId}, causation=${x.causationId ?? "No causation"}, payload=${x.payload ?? "No payload"}: `,
                        err,
                     )
                     replyMessage = x.prepareError(err.message)
                  }
               } else {
                  const err = new Error("No request payload!")
                  logger.error(
                     `Failed to handle msgId=${x.messageId}, correlation=${x.correlationId}, causation=${x.causationId ?? "No causation"}, payload=${x.payload ?? "No payload"}: `,
                     err,
                  )
                  replyMessage = x.prepareError(err.message)
               }
               return replyMessage
            }, this.config.concurrency ?? 1),
         ),
         this.replies,
      ).subscribe({
         next: (reply: ReplyMessage<Reply>): void => {
            if (reply.causationId !== undefined && reply.causationId !== null) {
               this.logger.log("Returning reply message: ", reply)
               const replyOn: Subject<ReplyMessage<Reply>> | undefined =
                  this.causationMap.get(reply.causationId)
               if (replyOn !== undefined) {
                  replyOn.next(reply)
                  this.causationMap.delete(reply.causationId)
               } else {
                  this.logger.error(
                     `Could not find handler for causation ${reply.causationId}`,
                  )
               }
            } else {
               const msgStr = JSON.stringify(reply)
               const fullMsg = `No reply to channel was available to return ${msgStr}`
               this.logger.error(fullMsg, new Error(msgStr))
            }
         },
         error: (error: any) => {
            this.logger.error("Unexpected error!", error)
         },
         complete: (): void => {
            this.logger.log("Input source is completing!")
            this.close()
         },
      })
   }

   public onApplicationBootstrap(): void {
      if (this.isActivated) {
         throw new Error("Call channel is already activated?")
      }
      if (this.subscription === undefined) {
         throw new Error("No handler was registered before bootstrap?")
      }
      this.logger.log("Activating Local Call Channel")
      this.activate$.next()
      this.isActivated = true
   }

   // Replaces: close(channel)
   close(): void {
      this.destroy$.next()
      this.activate$.complete()
      // this.destroy$.complete()
      this.subject.complete()
   }

   // Get observable for more RxJS-native usage
   // asObservable(): Observable<ReplyMessage<Reply>> {
   //    if (this.subscription === undefined) {
   //       throw new Error("Not yet activated")
   //    }
   //    return this.subject.asObservable()
   // }
}
