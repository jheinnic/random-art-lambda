import {
   PrefixData,
   PrefixString,
   SuffixData,
   SuffixString,
} from "./PaintingNamedValues.js"

/**
 * Seed data used to initialize a GenModel artwork space.
 *
 * The prefix and suffix are each arbitrary length binary seeds encoded as base64 strings, or
 * Uint8ClampedArray representations of a binary byte sequence.
 *
 * Callers who want to use phrase-based or string-based seeds should preprocess
 * them into utf8-encoded binary arrays to get equivalent behavior.
 *
 * This interface creates a standard value format for what a RandomArt rendering
 * will visualize, but it must be augmented by a RegionMap plot-space to define
 * what planar rectangle of its infinite spatial reach will be in-scope and at what
 * resolution.  See {@link RegionSpec} for those details.
 */
export interface GenModelSeed {
   /**
    * A base64 encoding of the content prefix used to seed this piece's GenModel
    */
   readonly seedPrefix: PrefixString | PrefixData
   readonly seedSuffix: SuffixString | SuffixData
}
