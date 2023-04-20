import { CombineObjects, UnionizeProperties } from "simplytyped"
import { CID } from "multiformats"

import { Prefix } from "./Prefix.js"
import { Suffix } from "./Suffix.js"
import { RandomArtworkSpec } from "./RandomArtworkSpec.js"

export type UnionMap<Representation, DomainModel> = [Representation, DomainModel];

export type UnionedTypeSpec = {
    [ K in string ]: { rep: unknown, domain: unknown }
}

export type UnionAsDomain<
    T extends UnionedTypeSpec
> = {
    [K in (string & keyof T)]?: T[K]['domain'] extends infer I ? I : never
}
 
export type UnionAsEnvelope<
    T extends UnionedTypeSpec,
    Discriminant extends string = "version",
    Model extends string = "model"
> = UnionizeProperties<{
    [K in keyof T]: T[K]['rep'] extends infer I
        ? CombineObjects<{ [D in Discriminant]: K }, { [R in Model]: I }>
        : never
}>

type DemoTypes = {
    "RandomArtworkSpec_0.1.0": { rep: [ Prefix, Suffix, CID, string ], domain: RandomArtworkSpec },
    "Prefix_0.1.0": { rep: number | Uint8Array, domain: Prefix }
}

let test: UnionAsEnvelope<DemoTypes, "repoVersion", "model"> = {
    repoVersion: "RandomArtworkSpec_0.1.0",
    model: [ Uint8Array.of(19), Uint8Array.of(173), CID.asCID(1)!, "strop" ]
}
// test.model = false
// test.repoVersion = "Prefix_0.1.0"
// test.model = 43
test = { repoVersion: "Prefix_0.1.0", model: Uint8Array.of(63) }

let test2: UnionAsDomain<DemoTypes> = {
    "RandomArtworkSpec_0.1.0": { prefix: Uint8Array.of(45), suffix: Uint8Array.of(95), regionMap: CID.asCID(1)!, engineVersion: "strop" }
}