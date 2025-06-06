import { CID } from "multiformats";
export let fested = {
    repoVersion: "RandomArtworkSpec_0.1.0",
    model: [Uint8Array.of(19), Uint8Array.of(173), CID.asCID(1), "strop"]
};
// test.model = false
// test.repoVersion = "Prefix_0.1.0"
// test.model = 43
fested = { repoVersion: "Prefix_0.1.0", model: Uint8Array.of(63) };
let tests2 = {
    "RandomArtworkSpec": { prefix: Uint8Array.of(45), suffix: Uint8Array.of(95), regionMap: CID.asCID(1), engineVersion: "strop" }
};
//# sourceMappingURL=ToyUnion_03.js.map