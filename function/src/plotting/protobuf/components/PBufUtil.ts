import { CID } from "multiformats"
import * as codec from "multiformats/codecs/raw"
import { sha256 as hasher } from "multiformats/hashes/sha2"

export {
   PointPlotData,
   PointPlotDocument,
   RefPoint,
} from "./plot_mapping_pb.js"

/**
 * Converts a Uint8Array (byte array) into an IPLD Content Identifier (CID).
 * using the raw codec (for CID v1)
 *
 * @param {Uint8Array} byteArray The byte array to convert.
 * @returns {CID} The IPLD v1 CID object.
 */
export async function bytesToCIDv1(byteArray: Buffer): Promise<CID> {
   const hash = await hasher.digest(byteArray)
   return CID.create(0, codec.code /* 85 */, hash)
}
