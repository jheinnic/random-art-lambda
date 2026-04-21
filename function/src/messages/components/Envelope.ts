import { AsyncLocalStorage } from "node:async_hooks"

import { getMyULIDFactory } from "../../painting/utility/ULIDFactory.js"
import { ULIDString, WorkloadId } from "../interface/NamedValues.js"
import { TraceIdentifier } from "../interface/TraceIdentifier.js"
import { Header } from "./Header.js"
import { MessageLifecycle } from "./MessageLifecycle.js"
import { EnvelopeCodec, isError, isPayload } from "./EnvelopeCodec.js"
import { Registry } from "./CodecRegistry.js"
import { ReleaseVersion } from "./ReleaseVersion.js"

/** * PROTOCOL CONSTANTS
 */

// TODO: Reply Stack header feature not implemented!
export const HDR_REPLY_STACK = "x-trace-reply-stack" as const
export const HDR_ENGINE_RELEASE = "x-engine-release" as const

/** Internal FSM symbol - not exported to keep the state transitions private */
const FSM_STATE: unique symbol = Symbol("Envelope::FSM_STATE")

// --- Dependency Injection Contexts ---
const ULID_FACTORY = new AsyncLocalStorage<() => ULIDString>()
ULID_FACTORY.enterWith(getMyULIDFactory())

export type Transformer<Payload extends object> = (
   raw: object,
   version: ReleaseVersion,
) => Payload | Error

// ============================================================
// ENVELOPE MEMENTO (Post-Deserialization Wire Format)
// ============================================================

/**
 * Opaque marker type for a deserialized Envelope.
 *
 * This represents the state after JSON deserialization but before
 * Envelope.fromWire() processing. The actual structure is intentionally
 * hidden from application code - the only valid operation is to pass
 * this to Envelope.fromWire() to obtain a proper Envelope instance.
 *
 * This implements the Memento pattern: the internal representation is
 * opaque to application code, preserving encapsulation of the wire format
 * and Codec details.
 *
 * At runtime this is just a plain JSON object - the brand properties are
 * phantom types that exist only for TypeScript's type system.
 *
 * @template Payload - The expected payload type after decoding
 * @template PayloadHeaders - The expected header key types
 */
export interface EnvelopeMemento<
   Payload extends object,
   PayloadHeaders extends string = never,
> {
   /** Phantom brand - does not exist at runtime, prevents accidental type coercion */
   readonly __brand: "EnvelopeMemento"
   /** Phantom type carrier for expected Payload type */
   readonly __phantom_payload?: Payload
   /** Phantom type carrier for expected header keys */
   readonly __phantom_headers?: PayloadHeaders
}

/**
 * Span timing information for distributed tracing integration.
 * Captures the lifecycle timestamps for communication and processing spans.
 */
export interface SpanTiming {
   /** When the envelope was created (communication span start) */
   createdAt: number
   /** When beginHandling() was called (communication span end, processing span start) */
   handlingStartedAt?: number
   /** When handling completed (processing span end) */
   handlingEndedAt?: number
}

/**
 * Configuration captured when an envelope enters AWAITING_PAYLOAD state.
 * This information is used later by commitBody()/commitError() to encode the message.
 */
interface OutboundConfig<
   PayloadHeaders extends string,
   Payload extends object,
> {
   releaseVersion: ReleaseVersion
   metadataMap?: Record<PayloadHeaders, keyof Payload>
}

/**
 * Internal state discriminated union for the Envelope FSM.
 * State transitions mutate the content in place for same-identity transitions,
 * or create new Envelope instances for new-identity transitions.
 */
type EnvelopeData<Payload extends object, PayloadHeaders extends string> =
   | {
        [FSM_STATE]: MessageLifecycle.AWAITING_PAYLOAD
        outboundConfig: OutboundConfig<PayloadHeaders, Payload>
     }
   | {
        [FSM_STATE]: MessageLifecycle.ENCODED
        payload: object
        isError: boolean
     }
   | {
        [FSM_STATE]: MessageLifecycle.RECEIVED
        payload: object
        isError: boolean
     }
   | {
        [FSM_STATE]: MessageLifecycle.DECODED_MESSAGE
        payload: Payload
        isError: false
     }
   | {
        [FSM_STATE]: MessageLifecycle.DECODED_ERROR
        payload: Error
        isError: true
     }
   | {
        [FSM_STATE]: MessageLifecycle.INVALID
        payload: any
        isError: true
     }
   | {
        [FSM_STATE]: MessageLifecycle.HANDLING
        payload: Payload
        isError: false
     }
   | {
        [FSM_STATE]: MessageLifecycle.EXHAUSTED
        payload: Payload | Error
        isError: boolean
     }

/**
 * THE ENVELOPE
 *
 * Envelope is a stateful container for messages in the RandomArt messaging system.
 * It manages the lifecycle of messages from creation through handling to response.
 *
 * Key design principles:
 * - Envelope identity = message identity (same trace = same envelope)
 * - State transitions within the same identity mutate in place
 * - Creating a new message identity (startReplying, createEnvelope) creates a new Envelope
 * - WorkloadId and ReleaseVersion are specified at envelope creation, not at commit time
 */
export class Envelope<
   Payload extends object,
   PayloadHeaders extends string = never,
> {
   /** Mutable content - state transitions mutate this in place */
   private _content: EnvelopeData<Payload, PayloadHeaders>

   /** Mutable span timing - updated during lifecycle */
   private _spanTiming: SpanTiming

   /** Mutable headers - may be updated during lifecycle (via push) */
   private readonly _headers: Header[]

   protected constructor(
      readonly trace: TraceIdentifier,
      readonly workloadId: WorkloadId,
      headers: Header[],
      content: EnvelopeData<Payload, PayloadHeaders>,
      spanTiming: SpanTiming,
   ) {
      this._headers = [...headers]
      this._content = content
      this._spanTiming = spanTiming
   }

   // ============================================================
   // STATIC FACTORY METHODS
   // ============================================================

   /**
    * Create a new envelope for sending a message.
    *
    * This is the entry point for sending messages when there is no incoming
    * envelope to derive from (e.g., FlowProducer creating jobs).
    *
    * @param workloadId - Identifies the codebase/codec for this message
    * @param releaseVersion - Version for encoding the message
    * @param parentTrace - Optional parent trace for creating child messages in a flow.
    *                      If omitted, creates a root message (correlationId = messageId).
    *                      If provided, inherits correlationId and uses parent's messageId as causationId.
    * @param metadataMap - Optional mapping of payload fields to headers
    * @returns New envelope in AWAITING_PAYLOAD state ready for commitBody()
    */
   static createEnvelope<
      Payload extends object,
      PayloadHeaders extends string = never,
   >(
      workloadId: WorkloadId,
      releaseVersion: ReleaseVersion,
      metadataMap?: Record<PayloadHeaders, keyof Payload>,
      correlationId?: ULIDString,
      causationId?: ULIDString,
   ): Envelope<Payload, PayloadHeaders> {
      const ulid = ULID_FACTORY.getStore() ?? getMyULIDFactory()
      const messageId = ulid()

      // Create trace: either root (self-caused) or child (linked to parent)
      const trace: TraceIdentifier = {
         correlationId: correlationId ?? messageId,
         causationId: causationId ?? correlationId ?? messageId, // Self-caused for root message
         messageId,
      }

      const now = Date.now()
      return new Envelope<Payload, PayloadHeaders>(
         trace,
         workloadId,
         [new Header(HDR_ENGINE_RELEASE, releaseVersion.toString())],
         {
            [FSM_STATE]: MessageLifecycle.AWAITING_PAYLOAD,
            outboundConfig: { releaseVersion, metadataMap },
         },
         { createdAt: now },
      )
   }

   /**
    * Restore an Envelope from its serialized memento form.
    *
    * This is the only valid way to convert a deserialized JSON blob back into
    * a proper Envelope instance. The memento carries phantom type information
    * about the expected Payload type, but its internal structure is opaque.
    *
    * @param memento - The deserialized envelope memento (from JSON.parse or BullMQ)
    * @param localVersion - The local version for compatibility checking
    * @param shim - Optional transformer for version migration
    * @returns Envelope in DECODED_MESSAGE, DECODED_ERROR, or INVALID state
    */
   static fromWire<
      Payload extends object,
      PayloadHeaders extends string = never,
   >(
      memento: EnvelopeMemento<Payload, PayloadHeaders>,
      localVersion: ReleaseVersion,
      shim?: Transformer<Payload>,
   ): Envelope<Payload, PayloadHeaders> {
      // Extract wire data from the memento (cast is safe - memento is opaque but known structure)
      const wire = memento as unknown as {
         trace: TraceIdentifier
         workloadId: WorkloadId
         headers: Array<{ key: string; value: string }>
         spanTiming: SpanTiming
         payload: object
         isError: boolean
      }

      // Convert header objects to Header instances
      const headers: Header[] = wire.headers.map(
         (h) => new Header(h.key, h.value),
      )

      // Construct the envelope directly
      const rawWireObject = new WireEnvelope<Payload, PayloadHeaders>(
         wire.trace,
         wire.workloadId,
         headers,
         wire.spanTiming,
         wire.payload,
         wire.isError,
      )

      return rawWireObject._accept(localVersion, shim)
   }

   // ============================================================
   // PUBLIC ACCESSORS
   // ============================================================

   get content(): EnvelopeData<Payload, PayloadHeaders> {
      return this._content
   }

   get spanTiming(): SpanTiming {
      return this._spanTiming
   }

   get headers(): readonly Header[] {
      return this._headers
   }

   /** Extract release version from headers */
   get releaseVersion(): ReleaseVersion | undefined {
      const header = this._headers.find((h) => h.key === HDR_ENGINE_RELEASE)
      if (header == null) {
         return undefined
      }
      return ReleaseVersion.parse(header.value)
   }

   get correlationId(): ULIDString {
      return this.trace.correlationId
   }

   get causationId(): ULIDString {
      return this.trace.causationId
   }

   get messageId(): ULIDString {
      return this.trace.messageId
   }

   get isHandling(): boolean {
      return this._content[FSM_STATE] === MessageLifecycle.HANDLING
   }

   get isExhausted(): boolean {
      return this._content[FSM_STATE] === MessageLifecycle.EXHAUSTED
   }

   get isAwaitingPayload(): boolean {
      return this._content[FSM_STATE] === MessageLifecycle.AWAITING_PAYLOAD
   }

   get isEncodedToSend(): boolean {
      return this._content[FSM_STATE] === MessageLifecycle.ENCODED
   }

   get isAccepted(): boolean {
      switch (this._content[FSM_STATE]) {
         case MessageLifecycle.INVALID:
         case MessageLifecycle.DECODED_MESSAGE:
         case MessageLifecycle.DECODED_ERROR: {
            return true
         }
         default: {
            return false
         }
      }
   }

   get isValid(): boolean {
      this._assertState(
         MessageLifecycle.INVALID,
         MessageLifecycle.DECODED_MESSAGE,
         MessageLifecycle.DECODED_ERROR,
      )
      return this._content[FSM_STATE] !== MessageLifecycle.INVALID
   }

   get isMessage(): boolean {
      return (
         this.isAccepted &&
         this._content[FSM_STATE] === MessageLifecycle.DECODED_MESSAGE
      )
   }

   get isError(): boolean {
      return (
         this.isAccepted &&
         this._content[FSM_STATE] === MessageLifecycle.DECODED_ERROR
      )
   }

   // ============================================================
   // PAYLOAD ACCESS
   // ============================================================

   /**
    * Get the decoded payload.
    * Valid in DECODED_MESSAGE or HANDLING states.
    */
   getPayload(): Payload {
      this._assertState(
         MessageLifecycle.DECODED_MESSAGE,
         MessageLifecycle.HANDLING,
      )
      const content = this._content as {
         [FSM_STATE]:
            | MessageLifecycle.DECODED_MESSAGE
            | MessageLifecycle.HANDLING
         payload: Payload
      }
      return content.payload
   }

   /**
    * Get the decoded error.
    * Valid only in DECODED_ERROR state.
    */
   getError(): Error {
      this._assertState(MessageLifecycle.DECODED_ERROR)
      const content = this._content as {
         [FSM_STATE]: MessageLifecycle.DECODED_ERROR
         payload: Error
      }
      return content.payload
   }

   // ============================================================
   // INBOUND LIFECYCLE (Wire → Decoded)
   // ============================================================

   /**
    * Accept and decode the wire payload.
    * Transitions: RECEIVED → DECODED_MESSAGE | DECODED_ERROR | INVALID
    */
   private _accept(
      localVersion: ReleaseVersion,
      shim?: Transformer<Payload>,
   ): Envelope<Payload, PayloadHeaders> {
      if (
         this._content[FSM_STATE] === MessageLifecycle.DECODED_MESSAGE ||
         this._content[FSM_STATE] === MessageLifecycle.DECODED_ERROR ||
         this._content[FSM_STATE] === MessageLifecycle.INVALID
      ) {
         return this
      }

      this._assertState(MessageLifecycle.RECEIVED)
      const current = this._content as {
         [FSM_STATE]: MessageLifecycle.RECEIVED
         payload: object
         isError: boolean
      }

      const remoteVersion = this.releaseVersion

      if (remoteVersion != null && !localVersion.canHandle(remoteVersion)) {
         this._content = {
            [FSM_STATE]: MessageLifecycle.INVALID,
            payload: new Error(
               `Version mismatch: message's ${remoteVersion.toString()} not handled by ${localVersion.toString()}`,
            ),
            isError: true,
         }
         return this
      }

      try {
         const codec: EnvelopeCodec<Payload> = this._getCodec(this.workloadId)
         const rawDecoded: Payload | Error = codec.decode(
            current.payload,
            remoteVersion ?? localVersion,
         )

         const finalized: Payload | Error =
            shim != null &&
            remoteVersion != null &&
            !localVersion.isEqual(remoteVersion)
               ? shim(rawDecoded, remoteVersion)
               : rawDecoded

         if (isPayload(finalized, current.isError)) {
            this._content = {
               [FSM_STATE]: MessageLifecycle.DECODED_MESSAGE,
               isError: false,
               payload: finalized,
            }
         } else if (isError(finalized, current.isError)) {
            this._content = {
               [FSM_STATE]: MessageLifecycle.DECODED_ERROR,
               isError: true,
               payload: finalized,
            }
         } else {
            throw new Error("Unreachable code")
         }
      } catch (e: any) {
         this._content = {
            [FSM_STATE]: MessageLifecycle.INVALID,
            payload: e,
            isError: true,
         }
      }

      return this
   }

   // ============================================================
   // HANDLING LIFECYCLE (Decoded → Handling → Exhausted)
   // ============================================================

   /**
    * Begin handling this message.
    *
    * Mutates this envelope from DECODED_MESSAGE to HANDLING state.
    * Records the handling start time (ends communication span, starts processing span).
    *
    * @throws Error if not in DECODED_MESSAGE state
    */
   beginHandling(): void {
      this._assertState(MessageLifecycle.DECODED_MESSAGE)
      const current = this._content as {
         [FSM_STATE]: MessageLifecycle.DECODED_MESSAGE
         payload: Payload
      }

      this._content = {
         [FSM_STATE]: MessageLifecycle.HANDLING,
         payload: current.payload,
         isError: false,
      }
      this._spanTiming = {
         ...this._spanTiming,
         handlingStartedAt: Date.now(),
      }
   }

   /**
    * End handling this message, closing the processing trace.
    *
    * Mutates this envelope from HANDLING to EXHAUSTED state.
    * After this, startReplying() cannot be called on this envelope.
    * Reply envelopes created before endHandling() can still complete their lifecycle.
    *
    * @returns The final SpanTiming with handlingEndedAt set
    * @throws Error if not in HANDLING state
    */
   endHandling(): SpanTiming {
      this._assertState(MessageLifecycle.HANDLING)
      const current = this._content as {
         [FSM_STATE]: MessageLifecycle.HANDLING
         payload: Payload
      }

      this._spanTiming = {
         ...this._spanTiming,
         handlingEndedAt: Date.now(),
      }

      this._content = {
         [FSM_STATE]: MessageLifecycle.EXHAUSTED,
         payload: current.payload,
         isError: false,
      }

      return this._spanTiming
   }

   /**
    * Create a child envelope for replying or fire-and-forget messaging.
    *
    * Can be called multiple times while handling is open (before endHandling()).
    * Each call creates an independent envelope with its own lifecycle and trace.
    *
    * @param workloadId - Workload for the reply (required if different from current)
    * @param releaseVersion - Version for encoding (required if workloadId provided)
    * @param metadataMap - Optional mapping of payload fields to headers
    * @throws Error if not in HANDLING state, or if workloadId provided without releaseVersion
    */
   startReplying<
      NextPayload extends object,
      NextPayloadHeaders extends string = never,
   >(
      workloadId?: WorkloadId,
      releaseVersion?: ReleaseVersion,
      metadataMap?: Record<NextPayloadHeaders, keyof NextPayload>,
   ): Envelope<NextPayload, NextPayloadHeaders> {
      this._assertState(MessageLifecycle.HANDLING, MessageLifecycle.ENCODED)

      // Validate workloadId/releaseVersion pairing
      if (
         (workloadId != null && releaseVersion == null) ||
         (workloadId == null && releaseVersion != null)
      ) {
         throw new Error(
            "startReplying: workloadId and releaseVersion must both be provided or both omitted",
         )
      }

      // Use provided values or inherit from current envelope
      const effectiveWorkloadId = workloadId ?? this.workloadId
      const effectiveVersion = releaseVersion ?? this.releaseVersion
      if (effectiveVersion == null) {
         throw new Error(
            "startReplying: no releaseVersion available (not in headers and not provided)",
         )
      }

      const ulid = ULID_FACTORY.getStore() ?? getMyULIDFactory()
      const now = Date.now()

      // Create child trace - this message is caused by the handling message
      const childTrace: TraceIdentifier = {
         correlationId: this.trace.correlationId,
         causationId: this.trace.messageId,
         messageId: ulid(),
      }

      // Start with fresh headers - only the release version header
      // Caller's body-derived headers should NOT be retained
      const freshHeaders = [
         new Header(HDR_ENGINE_RELEASE, effectiveVersion.toString()),
      ]

      return new Envelope<NextPayload, NextPayloadHeaders>(
         childTrace,
         effectiveWorkloadId,
         freshHeaders,
         {
            [FSM_STATE]: MessageLifecycle.AWAITING_PAYLOAD,
            outboundConfig: {
               releaseVersion: effectiveVersion,
               metadataMap,
            },
         },
         { createdAt: now },
      )
   }

   // ============================================================
   // OUTBOUND LIFECYCLE (AwaitingPayload → Encoded)
   // ============================================================

   /**
    * Commit a payload body to this envelope.
    *
    * Mutates this envelope from AWAITING_PAYLOAD to ENCODED state.
    * Uses the releaseVersion and metadataMap captured at envelope creation.
    *
    * @param body - The payload to encode
    * @throws Error if not in AWAITING_PAYLOAD state
    */
   commitBody(body: Payload): void {
      this._assertState(MessageLifecycle.AWAITING_PAYLOAD)
      const current = this._content as {
         [FSM_STATE]: MessageLifecycle.AWAITING_PAYLOAD
         outboundConfig: OutboundConfig<PayloadHeaders, Payload>
      }

      const { releaseVersion, metadataMap } = current.outboundConfig
      const encoded: object = this._getCodec(this.workloadId).encode(
         body,
         releaseVersion,
      )

      // Apply metadata map to headers
      if (metadataMap != null) {
         for (const [hKey, pKey] of Object.entries(metadataMap)) {
            const val = (encoded as Record<string, unknown>)[pKey as string]
            if (val !== undefined && val !== null) {
               this._headers.push(new Header(hKey, JSON.stringify(val)))
            }
         }
      }

      this._content = {
         [FSM_STATE]: MessageLifecycle.ENCODED,
         payload: encoded,
         isError: false,
      }
   }

   /**
    * Commit an error to this envelope.
    *
    * Mutates this envelope from AWAITING_PAYLOAD to ENCODED state.
    * Uses the releaseVersion captured at envelope creation.
    *
    * @param error - The error to encode
    * @throws Error if not in AWAITING_PAYLOAD state
    */
   commitError(error: Error): void {
      this._assertState(MessageLifecycle.AWAITING_PAYLOAD)
      const current = this._content as {
         [FSM_STATE]: MessageLifecycle.AWAITING_PAYLOAD
         outboundConfig: OutboundConfig<PayloadHeaders, Payload>
      }

      const { releaseVersion } = current.outboundConfig
      const encoded: object = this._getCodec(this.workloadId).encode(
         error,
         releaseVersion,
      )

      this._content = {
         [FSM_STATE]: MessageLifecycle.ENCODED,
         payload: encoded,
         isError: true,
      }
   }

   /**
    * Serialize this envelope to its wire format (memento).
    *
    * This method is automatically called by JSON.stringify(), making ENCODED
    * envelopes directly serializable for BullMQ job data or other transport.
    *
    * The returned memento is opaque - its structure should not be relied upon.
    * Use Envelope.fromWire() to restore the envelope on the receiving side.
    *
    * @returns Opaque memento suitable for serialization
    * @throws Error if not in ENCODED state
    */
   toJSON(): EnvelopeMemento<Payload, PayloadHeaders> {
      this._assertState(MessageLifecycle.ENCODED)
      const content = this._content as {
         [FSM_STATE]: MessageLifecycle.ENCODED
         payload: object
         isError: boolean
      }

      // Construct wire format - structure is internal detail
      const wireFormat = {
         trace: this.trace,
         workloadId: this.workloadId,
         headers: this._headers.map((h) => ({ key: h.key, value: h.value })),
         spanTiming: this._spanTiming,
         payload: content.payload,
         isError: content.isError,
      }

      // Cast to EnvelopeMemento - at runtime it's just a plain object,
      // but TypeScript tracks the Payload/Headers types through the phantom brand
      return wireFormat as unknown as EnvelopeMemento<Payload, PayloadHeaders>
   }

   // ============================================================
   // CONVENIENCE METHOD
   // ============================================================

   /**
    * Handle this message with a callback.
    *
    * Semantic sugar for: beginHandling() → handler() → startReplying() → commit → endHandling()
    *
    * The handler operates within the same workload context as the received message.
    * If the handler needs to send messages to other workloads, it should call
    * startReplying() explicitly with the target workload/version.
    *
    * @param handler - Async function to process this message and return reply payload
    * @returns The reply envelope in ENCODED state
    */
   async handleWith<
      ReplyPayload extends object,
      ReplyHeaders extends string = never,
   >(
      handler: (envelope: this) => Promise<ReplyPayload>,
      metadataMap?: Record<ReplyHeaders, keyof ReplyPayload>,
   ): Promise<Envelope<ReplyPayload, ReplyHeaders>> {
      this.beginHandling()

      try {
         const result = await handler(this)

         const reply = this.startReplying<ReplyPayload, ReplyHeaders>(
            undefined,
            undefined,
            metadataMap,
         )
         reply.commitBody(result)
         this.endHandling()
         return reply
      } catch (error) {
         const reply = this.startReplying<ReplyPayload, ReplyHeaders>()
         reply.commitError(
            error instanceof Error ? error : new Error(String(error)),
         )
         this.endHandling()
         return reply
      }
   }

   // ============================================================
   // PRIVATE HELPERS
   // ============================================================

   private _getCodec(id: WorkloadId): EnvelopeCodec<Payload> {
      const codec: EnvelopeCodec<Payload> | undefined =
         Registry.get<Payload>(id)
      if (codec == null) {
         throw new Error(
            `No codec registered for workload: "${id}". ` +
               `Ensure the module for this workload is imported and registers its codec.`,
         )
      }
      return codec
   }

   private _assertState(...expected: MessageLifecycle[]): void {
      const currentState = this._content[FSM_STATE]
      if (!expected.includes(currentState)) {
         throw new Error(
            `State Violation: Expected one of [${expected.join(", ")}], but actual was ${String(currentState)}`,
         )
      }
   }
}

/**
 * Wire format envelope for deserialization.
 *
 * This subclass provides a public constructor that accepts all wire format
 * data directly, bypassing the need for class-transformer's plainToInstance.
 * The fromWire() static method extracts wire data and constructs this directly.
 */
class WireEnvelope<
   Payload extends object,
   PayloadHeaders extends string = never,
> extends Envelope<Payload, PayloadHeaders> {
   constructor(
      trace: TraceIdentifier,
      workloadId: WorkloadId,
      headers: Header[],
      spanTiming: SpanTiming,
      payload: object,
      isError: boolean,
   ) {
      const receivedState: EnvelopeData<Payload, PayloadHeaders> = {
         [FSM_STATE]: MessageLifecycle.RECEIVED,
         payload,
         isError,
      }
      super(trace, workloadId, headers, receivedState, spanTiming)
   }
}
