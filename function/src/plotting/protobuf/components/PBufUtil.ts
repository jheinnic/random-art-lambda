import { CID } from "multiformats"
// import * as codec from "multiformats/codecs/raw"
import * as codec from "@ipld/dag-cbor"
import { sha256 as hasher } from "multiformats/hashes/sha2"

export {
   PointPlotData,
   PointPlotDocument,
   RefPoint,
} from "./plot_mapping_pb.js"

/**
 * Converts a Uint8Array (byte array) into an IPLD Content Identifier (CID).
 * pretending to use the dag-cbor codec (for CID v1)
 *
 * @param {Uint8Array} byteArray The byte array to convert.
 * @returns {CID} The IPLD v1 CID object.
 */
export async function bytesToCIDv1(byteArray: Buffer): Promise<CID> {
   const hash = await hasher.digest(byteArray)
   return CID.create(1, codec.code /* 113 */, hash)
}
