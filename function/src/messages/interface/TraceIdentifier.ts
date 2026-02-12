import { ULIDString } from "./NamedValues.js"

export interface TraceIdentifier {
   readonly correlationId: ULIDString
   readonly causationId: ULIDString
   readonly messageId: ULIDString
}
