import { AsyncLocalStorage } from "async_hooks"
import { Envelope } from "../../messages/components/Envelope.js"
import { TraceIdentifier } from "../../messages/interface/TraceIdentifier.js"

const traceStorage = new AsyncLocalStorage<TraceIdentifier>()

/**
 * Provides access to the current trace context during async message processing.
 *
 * TraceContext integrates with Envelope's lifecycle to make the current trace
 * available via AsyncLocalStorage for logging, telemetry, and correlation.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class TraceContext {
   /**
    * Runs handler within a trace context, making the current trace available
    * via TraceContext.current() throughout the async execution.
    *
    * Uses Envelope's handleWith() for proper lifecycle management:
    * - Transitions envelope to HANDLING state
    * - Creates reply envelope via startReplying() (inherits workload/version)
    * - Commits result/error and returns ENCODED envelope
    *
    * @param envelope - Incoming envelope in DECODED_MESSAGE state
    * @param work - Handler function receiving the payload, returning reply payload
    * @param metadataMap - Optional mapping of reply payload fields to headers
    * @returns ENCODED reply envelope ready for transmission
    */
   static async run<
      TIn extends object,
      TOut extends object,
      InHeaders extends string = never,
      OutHeaders extends string = never,
   >(
      envelope: Envelope<TIn, InHeaders>,
      work: (payload: TIn) => Promise<TOut>,
      metadataMap?: Record<OutHeaders, keyof TOut>,
   ): Promise<Envelope<TOut, OutHeaders>> {
      // Use the Envelope's trace as the execution context
      const executionSpan: TraceIdentifier = envelope.trace

      return await traceStorage.run(executionSpan, async () => {
         return await envelope.handleWith<TOut, OutHeaders>(
            async (handling: Envelope<TIn, InHeaders>) => {
               return await work(handling.getPayload())
            },
            metadataMap,
         )
      })
   }

   /**
    * Get the current trace identifier from the async context.
    *
    * Use this for logging, telemetry, or any operation that needs
    * to correlate with the current message being processed.
    *
    * @throws Error if called outside of a TraceContext.run() callback
    */
   static current(): TraceIdentifier {
      const retVal: TraceIdentifier | undefined = traceStorage.getStore()
      if (retVal === undefined) {
         throw new Error(
            "Unable to get trace context - not running within TraceContext.run()",
         )
      }
      return retVal
   }

   /**
    * Check if we're currently within a trace context.
    *
    * Useful for conditional logging or telemetry that should only
    * run when processing a traced message.
    */
   static hasContext(): boolean {
      return traceStorage.getStore() !== undefined
   }
}
