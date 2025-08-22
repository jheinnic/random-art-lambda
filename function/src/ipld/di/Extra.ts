// import { BlockCodec } from 'multiformats/codecs'
import { BlockCodec, MultihashHasher } from "multiformats"

export class SerdesConfiguration<
   T = unknown,
   Code extends 113 = 113,
   Hash extends 18 = 18,
> {
   constructor(
      public readonly schemaDsl: string,
      public readonly rootProductionTokens: Readonly<
         Record<string, symbol | string>
      >,
      public readonly codec: BlockCodec<Code, T>,
      public readonly hasher: MultihashHasher<Hash>,
   ) {}
}

export interface IpldModuleExtras {
   serdes: SerdesConfiguration
}
