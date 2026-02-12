import { Envelope } from "./Envelope.js"

export interface Message<Content> extends Envelope {
   payload?: Content
}

export function isMessage<Content>(
   input: Content | Message<Content>,
): input is Message<Content> {
   if (typeof input === "object" && input !== null && "payload" in input) {
      return true
   }
   return false
}
