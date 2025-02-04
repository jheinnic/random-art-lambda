import { UnionizeProperties } from 'simplytyped'
import { RepresentDomainPair } from './RepresentDomainPair.js'

export type ISchemaSignature<K extends string = string> = Record<K, RepresentDomainPair>

export type ISchemaRepresentations<S extends ISchemaSignature> = UnionizeProperties<{
    [ K in keyof S ]: S[ K ][ 0 ] extends infer I ? I : never
}>