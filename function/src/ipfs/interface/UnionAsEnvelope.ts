import { CombineObjects, UnionizeProperties } from "simplytyped"

import { Prefix } from "./Prefix"
import { RandomArtworkSpec } from "./RandomArtworkSpec.js"

export type UnionAsEnvelope<T extends object, Discriminant extends string, Record extends string> = UnionizeProperties<{
    [K in keyof T]: CombineObjects<{ [ D in Discriminant ]: K }, { [R in Record]: T[K] }>
}>

interface DemoTypes {
    "RandomArtworkSpec_0.1.0": [Prefix, Suffix, CID, string],
    "Prefix_0.1.0": Prefix
}
type Demo = EnvelopeRepresentation<DemoTypes, "repoVersion", "model">

let test: Demo = {
    repoVersion: "RandomArtworkSpec_0.1.0",
    model: new RandomArtworkSpec()
}
test.model = false
test.repoVersion = "Prefix_0.1.0"
test.repoVersion = 43