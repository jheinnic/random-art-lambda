import { ReleaseVersion } from "./ReleaseVersion.js"

/**
 * The contract for workload-specific serialization.
 * Implementing this ensures that the Envelope utility remains
 * agnostic of the binary format (JSON, Avro, Protobuf, etc.).
 */
export interface EnvelopeCodec<T extends object> {
   encode: (data: T | Error, version: ReleaseVersion) => object

   decode: (data: object, version: ReleaseVersion) => T | Error
}

export function isPayload<T extends object>(
   data: T | Error,
   isError: boolean,
): data is T {
   return !isError
}

export function isError<T extends object>(
   data: T | Error,
   isError: boolean,
): data is Error {
   return isError
}
