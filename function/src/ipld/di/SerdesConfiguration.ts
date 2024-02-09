import { StringKeys } from 'simplytyped'
// import { BlockCodec } from 'multiformats/codecs'
import { BlockCodec, MultihashHasher } from 'multiformats'
import { RepresentDomainPair, ISchemaSignature, ISchemaRepresentations } from '../interface'

export class SerdesConfiguration {
  constructor (
    public readonly schemaDsl: string,
    public readonly rootProductionTokens: Readonly<Record<string, symbol | string>>,
    public readonly codecCode: number,
    public readonly codec: BlockCodec<typeof codecCode, unknown>,
    public readonly hashCode: number,
    public readonly hasher: MultihashHasher<typeof hashCode>,
  ) { }
}
