import { UnionizeProperties } from "simplytyped"
import {
   DomainModelOf,
   RepresentationOf,
   RepresentDomainTuple,
} from "./RepresentDomainPair.js"

type MaybeUnionDefinition<N extends string> = Record<
   N,
   RepresentDomainTuple<string, unknown, unknown>
>

// export type UnionDefinition<Keys = string, Representation = Record<Keys, unknown>, DomainModel = Record<Keys, unknown>> = {
// [ K in Keys ]: RepresentDomainPair<Representation[K], DomainModel[K]>
// }
// export type UnionDefinition<Union extends Record<string, RepresentDomainPair> = Record<string, RepresentDomainPair>> = {
// [ K in keyof Union ]: Union[K]
// }
export type UnionDefinition<
   N extends string,
   T extends MaybeUnionDefinition<N>,
> = T extends {
   [K in N]: T[K] extends [infer M extends string, infer R, infer D]
      ? RepresentDomainTuple<M, R, D>
      : never
}
   ? T
   : never

// This should an object keyed by the discriminant values, each mapping to its, the element 1 domain from RepDomainPair
// Unsure why using UnionizeProperties, since there is no property overlap in the union of object types...?
// See SchemaSignature!!!
export type UnionAsDomainModel<
   N extends string,
   T extends MaybeUnionDefinition<N>,
> =
   T extends UnionDefinition<N, T>
      ? UnionizeProperties<{
           [K in N]: { [P in K]: DomainModelOf<T[P]> }
        }>
      : never

// export type UnionAsDomainModel<T extends UnionDefinition> = UnionizeProperties<{
//     [ K in keyof T ]: T[ K ][ 1 ] extends infer I ? I : never
// }>

// This should be an object with two keys, version and model.  Version is a union of the keys from UnionDefinition,
// and model is a union of the element 0 representation types from RepDomainPair.
export type UnionAsRepresentation<
   N extends string,
   T extends MaybeUnionDefinition<N>,
   Discriminant extends string = "version",
   Model extends string = "model",
> =
   T extends UnionDefinition<N, T>
      ? UnionizeProperties<{
           [K in N]: {
              //   ? K extends K // RepresentationOf<T[K]> extends infer I
              [D in Discriminant | Model]: D extends Discriminant
                 ? K
                 : RepresentationOf<T[K]>
           }
           //   : never
           //   : never
        }>
      : never

export type RepresentUnionPair<
   SchemaName extends string,
   N extends string,
   T extends MaybeUnionDefinition<N>,
   Discriminant extends string = "version",
   Model extends string = "model",
> =
   T extends UnionDefinition<N, T>
      ? RepresentDomainTuple<
           SchemaName,
           UnionAsRepresentation<N, T, Discriminant, Model>,
           UnionAsDomainModel<N, T>
        >
      : never
