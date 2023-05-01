import { CombineObjects, UnionizeProperties } from "simplytyped"

export type UnionMap<Representation = unknown, DomainModel = unknown> = [ Representation, DomainModel ]

export type UnionTypes = {
    // [ K in string ]: { rep: unknown, domain: unknown }
    [ K in string ]: UnionMap
}

export type UnionAsDomainModel<T extends UnionTypes> = {
    [ K in ( string & keyof T ) ]?: T[ K ][ 1 ] extends infer I ? I : never
}

export type UnionAsEnvelope<
    T extends UnionTypes,
    Discriminant extends string = "version",
    Model extends string = "model"
> = UnionizeProperties<{
    [ K in keyof T ]: T[ K ][ 0 ] extends infer I
    ? CombineObjects<{ [ D in Discriminant ]: K }, { [ R in Model ]: I }>
    : never
}>
