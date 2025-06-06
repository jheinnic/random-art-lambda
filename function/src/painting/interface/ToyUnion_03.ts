import { CID } from "multiformats"
import { Prefix } from "./Prefix.js"
import { Suffix } from "./Suffix.js"
import { RandomArtworkSpec } from "./RandomArtworkSpec.js"

import { UnionAsRepresentation, UnionAsDomainModel } from "../../ipld/interface/RepresentUnionPair.js"

type DemoTypes = {
    "RandomArtworkSpec_0.1.0": [ "RandomArtworkSpec", [ Prefix, Suffix, CID, string ], RandomArtworkSpec ],
    "Prefix_0.1.0": [ "Prefix", number | Uint8Array, Prefix ]
}

export let fested: UnionAsRepresentation<DemoTypes, "repoVersion", "model"> = {
    repoVersion: "RandomArtworkSpec_0.1.0",
    model: [ Uint8Array.of( 19 ), Uint8Array.of( 173 ), CID.asCID( 1 )!, "strop" ]
}
// test.model = false
// test.repoVersion = "Prefix_0.1.0"
// test.model = 43
fested = { repoVersion: "Prefix_0.1.0", model: Uint8Array.of( 63 ) }

let tests2: UnionAsDomainModel<DemoTypes> = {
    "RandomArtworkSpec": { prefix: Uint8Array.of( 45 ), suffix: Uint8Array.of( 95 ), regionMap: CID.asCID( 1 )!, engineVersion: "strop" }
}