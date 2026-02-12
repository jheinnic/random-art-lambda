import { CID } from "multiformats"
import { CIDUtil } from "../../painting/utility/CIDUtil.js"
import { AsyncLocalStorage } from "async_hooks"
import { EnvelopeCodec } from "./EnvelopeCodec.js"
import { ReleaseVersion } from "./ReleaseVersion.js"
// import { AsyncCallRequestImpl } from "../../../channels/components/AsyncCallRequestImpl.js"
// import { ReplyMessageImpl } from "../../../channels/components/ReplyMessageImpl.js"

export function encodeMessage(msg: any): any {
   if (msg instanceof Error) {
      // Error properties are not enumerable, so we extract them explicitly
      return {
         __t: "Error",
         name: msg.name,
         message: msg.message,
         stack: msg.stack,
      }
   }
   if (msg instanceof CID) {
      return { __t: "CID", v: msg.toString() }
   }
   if (msg instanceof Uint8ClampedArray) {
      const buf = Buffer.from(msg.buffer)
      return { __t: "U8C", v: buf.toString("base64") }
   }
   if (msg instanceof Uint32Array) {
      const buf = Buffer.from(msg.buffer)
      return { __t: "U32", v: buf.toString("base64") }
   }
   // if (msg instanceof AsyncCallRequestImpl) {
   //    return { __t: "AsyncCall", ...msg, payload: encodeMessage(msg.payload) }
   // }
   // if (msg instanceof ReplyMessageImpl) {
   //    return { __t: "ReplyMsg", ...msg, payload: encodeMessage(msg.payload) }
   // }
   if (Array.isArray(msg)) {
      return msg.map(encodeMessage)
   }
   if (msg !== undefined && typeof msg === "object") {
      return Object.fromEntries(
         Object.entries(msg).map(([k, v]) => [k, encodeMessage(v)]),
      )
   }
   return msg
}

export function decodeMessage(msg: any): any {
   if (msg == null) {
      return undefined
   }
   if (msg.__t != null) {
      switch (msg.__t) {
         case "Error": {
            const error = new Error(msg.message)
            error.name = msg.name
            error.stack = msg.stack
            return error
         }
         case "CID": {
            return CIDUtil.parseCID(msg.v)
         }
         case "U32": {
            const newBuffer = Buffer.from(msg.v, "base64")
            return new Uint32Array(
               newBuffer.buffer,
               newBuffer.byteOffset,
               newBuffer.byteLength / 4,
            )
         }
         case "U8C": {
            const newBuffer = Buffer.from(msg.v, "base64")
            return new Uint8ClampedArray(
               newBuffer.buffer,
               newBuffer.byteOffset,
               newBuffer.byteLength,
            )
         }
         default: {
            throw new Error(
               "Unimplemented codec data transform type: " + msg.__t,
            )
         }
      }
      // if (msg?.__t === "AsyncCall") {
      //    return new AsyncCallRequestImpl(
      //       msg.messageId,
      //       msg.correlationId,
      //       msg.causationId,
      //       msg.timestamp,
      //       msg.headers,
      //       decodeMessage(msg.payload),
      //    )
      // }
      // if (msg?.__t === "ReplyMsg") {
      //    return new ReplyMessageImpl(
      //       msg.messageId,
      //       msg.correlationId,
      //       msg.causationId,
      //       msg.timestamp,
      //       msg.headers,
      //       msg.status,
      //       msg.error,
      //       decodeMessage(msg.payload),
      //    )
      // }
   }
   if (Array.isArray(msg)) {
      return msg.map(decodeMessage)
   }
   if (msg instanceof Set) {
      return new Set([...msg.values()].map(decodeMessage))
   }
   if (msg !== undefined && typeof msg === "object") {
      return Object.fromEntries(
         Object.entries(msg).map(([k, v]) => [k, decodeMessage(v)]),
      )
   }
   return msg
}

export const LOCAL_ENCODE = new AsyncLocalStorage<(it: any) => any>()
LOCAL_ENCODE.enterWith(encodeMessage)

export const LOCAL_DECODE = new AsyncLocalStorage<(it: any) => any>()
LOCAL_DECODE.enterWith(decodeMessage)

function encode(body: any): any {
   const codec = LOCAL_ENCODE.getStore()
   return codec != null ? codec(body) : encodeMessage(body)
}

function decode(body: any): any {
   const codec = LOCAL_DECODE.getStore()
   return codec != null ? codec(body) : decodeMessage(body)
}

export function getCodec<Payload extends object>(): EnvelopeCodec<Payload> {
   return {
      encode: (data: Payload | Error, _version: ReleaseVersion): object =>
         encode(data),
      decode: (payload: object, _version: ReleaseVersion): Payload | Error =>
         decode(payload),
   }
}
