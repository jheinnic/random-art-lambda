import { EnvelopeCodec } from "./EnvelopeCodec.js"

/** * 1. THE REGISTRY (Must be defined before class) */
class CodecRegistry {
   private static instance: CodecRegistry | undefined
   private readonly codecs: Map<string, EnvelopeCodec<any>> = new Map<
      string,
      EnvelopeCodec<any>
   >()

   static getInstance(): CodecRegistry {
      // Explicit comparison to satisfy strict-boolean-expressions
      if (this.instance == null) {
         this.instance = new CodecRegistry()
      }
      return this.instance
   }

   register<Payload extends object>(
      id: string,
      codec: EnvelopeCodec<Payload>,
   ): void {
      this.codecs.set(id, codec)
   }

   get<Payload extends object>(id: string): EnvelopeCodec<Payload> | undefined {
      return this.codecs.get(id)
   }
}

export const Registry: CodecRegistry = CodecRegistry.getInstance()
