import { InjectionToken } from "@nestjs/common"
import { BlockCodec, MultihashHasher } from "multiformats"
import {
   RepresentationOf,
   RepresentDomainTuple,
   SchemaNameOf,
} from "../interface/RepresentDomainPair.js"

export class SerdesConfiguration<
   T extends RepresentDomainTuple<string, unknown, unknown>,
   Code extends 113 = 113,
   Hash extends 18 = 18,
> {
   constructor(
      public readonly schemaDsl: string,
      public readonly rootProductionTokens: Readonly<
         Record<SchemaNameOf<T>, InjectionToken>
      >,
      public readonly codec: BlockCodec<Code, T>,
      public readonly hasher: MultihashHasher<Hash>,
   ) {}
}

export interface IpldModuleExtras<
   T extends RepresentDomainTuple<string, unknown, unknown>,
> {
   serdes: SerdesConfiguration<T>
}

export interface ISerdesModuleBuilder<
   T extends RepresentDomainTuple<string, unknown, unknown> = [
      string,
      unknown,
      unknown,
   ],
   Code extends number = 113,
   Hash extends number = 18,
> {
   exportProduction: (
      typeName: SchemaNameOf<T>,
      token: InjectionToken,
   ) => ISerdesModuleBuilder<T, Code, Hash>

   changeCodec: <Code2 extends number = Code>(
      codec: BlockCodec<Code2, RepresentationOf<T>>,
   ) => ISerdesModuleBuilder<T, Code2, Hash>

   changeMultihash: <Hash2 extends number = Hash>(
      hasher: MultihashHasher<Hash2>,
   ) => ISerdesModuleBuilder<T, Code, Hash2>
}
