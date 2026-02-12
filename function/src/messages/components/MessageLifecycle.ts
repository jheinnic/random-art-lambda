/**
 * Lifecycle states for inbound and outbound transitions.
 * -- SEALING -> ENCODED -> SENDING ->
 *
 * = UNUSED =            = IN TRANSIT =          = TRASHED =
 *
 *                         RECEIVING -> DECODED -> DISCARDING
 *
 * UNUSED, IN_TRANSIT, and TRASHED are unmanaged states.  These are the legitimate
 * states a deserialized Envelope may be in when it comes to exist by deserialization
 * from a wire protocol state.
 * -- The sender infra will accept UNUSED envelopes and place them in the
 *    SEALING state to block additional changes while their contents are ENCODED
 * -- The sender infra will start SENDING an ENCODED Envelope when told, placing
 *    it IN TRANSIT before letting it go
 * -- THe receive infra will accept IN_TRANSIT Envelopes, placing them in the
 *    RECEIVING state until their contents are exposeable as DECODED.  When an
 * -- When no longer needed, the receive infra begins DISCARDING an Envelope,
 *    leaving it in the TRASHED state.
 *
 * UNUSED is also the state a sender may use to
 */
export enum MessageLifecycle {
   // === Outbound states ===
   AWAITING_PAYLOAD = "AWAITING_PAYLOAD",
   ENCODED = "ENCODED",

   // === Inbound states ===
   RECEIVED = "RECEIVED",
   DECODED_MESSAGE = "DECODED_MESSAGE",
   DECODED_ERROR = "DECODED_ERROR",
   INVALID = "INVALID", // Decoding a message with no payload

   // === Processing states (for span lifecycle) ===
   /**
    * Handler has begun processing this message.
    * Marks the end of communication+queue delay span.
    * Marks the start of the processing span.
    */
   HANDLING = "HANDLING",

   /**
    * Message has been fully handled.
    * Marks the end of the processing span.
    * No further operations allowed on this envelope.
    */
   EXHAUSTED = "EXHAUSTED",

   // WAITING_FOR_ACK
   // READY_TO_ACK
   // ACKNOWLEDGING
   // ACKNOWLEDGED
}
