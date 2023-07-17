import { CombineObjects, UnionizeProperties } from "simplytyped"
import { RepresentDomainPair } from "./RepresentDomainPair.js"

export type UnionDefinition = {
    [ K in string ]: RepresentDomainPair
}

export type UnionAsDomainModel<T extends UnionDefinition> = UnionizeProperties<{
    [ K in keyof T ]: T[ K ][ 1 ] extends infer I
    ? { [ P in K ]: I }
    : never
}>

export type UnionAsRepresentation<
    T extends UnionDefinition,
    Discriminant extends string = "version",
    Model extends string = "model"
> = UnionizeProperties<{
    [ K in keyof T ]: T[ K ][ 0 ] extends infer I
    ? { [ D in Discriminant | Model ]: D extends Discriminant ? K : D extends Model ? I : never }
    : never
}>

export type RepresentUnionPair<
    T extends UnionDefinition,
    Discriminant extends string = "version",
    Model extends string = "model"
> = RepresentDomainPair<
    UnionAsRepresentation<T, Discriminant, Model>,
    UnionAsDomainModel<T>
>