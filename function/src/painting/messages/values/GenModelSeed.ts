import { CID } from "multiformats"
import {
   PrefixString,
   SuffixString,
   CIDString,
} from "../../../messages/interface/NamedValues.js"

/**
 * Seed data used to initialize a GenModel artwork space.
 *
 * The prefix and suffix are each arbitrary length binary seeds encoded as base64 strings.
 * The regionMapRef CID identifies the coordinate mapping/dimensions.
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
   readonly seedPrefix: PrefixString // base64-encoded 16-byte binary seed
   readonly seedSuffix: SuffixString // base64-encoded 16-byte binary seed
}
