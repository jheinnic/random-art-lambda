import { UnionizeProperties } from "simplytyped"
import {
   NamedRepresentDomainPair,
   RepresentDomainPair,
} from "./RepresentDomainPair.js"

// export type UnionDefinition<Keys = string, Representation = Record<Keys, unknown>, DomainModel = Record<Keys, unknown>> = {
// [ K in Keys ]: RepresentDomainPair<Representation[K], DomainModel[K]>
// }
// export type UnionDefinition<Union extends Record<string, RepresentDomainPair> = Record<string, RepresentDomainPair>> = {
// [ K in keyof Union ]: Union[K]
// }
export type UnionDefinition = Record<string, NamedRepresentDomainPair>

// This should an object keyed by the discriminant values, each mapping to its, the element 1 domain from RepDomainPair
// Unsure why using UnionizeProperties, since there is no property overlap in the union of object types...?
// See SchemaSignature!!!
export type UnionAsDomainModel<T extends UnionDefinition> = UnionizeProperties<{
   [K in keyof T as T[K][0]]: T[K][2] extends infer I
      ? { [P in K as T[P][0]]: I }
      : never
}>

// export type UnionAsDomainModel<T extends UnionDefinition> = UnionizeProperties<{
//     [ K in keyof T ]: T[ K ][ 1 ] extends infer I ? I : never
// }>

// This should be an object with two keys, version and model.  Version is a union of the keys from UnionDefinition,
// and model is a union of the element 0 representation types from RepDomainPair.
export type UnionAsRepresentation<
   T extends UnionDefinition,
   Discriminant extends string = "version",
   Model extends string = "model",
> = UnionizeProperties<{
   [K in keyof T]: T[K][1] extends infer I
      ? {
           [D in Discriminant | Model]: D extends Discriminant
              ? K
              : D extends Model
                ? I
                : never
        }
      : never
}>

export type RepresentUnionPair<
   T extends UnionDefinition,
   Discriminant extends string = "version",
   Model extends string = "model",
> = RepresentDomainPair<
   UnionAsRepresentation<T, Discriminant, Model>,
   UnionAsDomainModel<T>
>
