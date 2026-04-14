import { CID } from "multiformats"
import { base58btc } from "multiformats/bases/base58"
import type {
   CIDString,
   LiteCIDString,
} from "../../messages/interface/NamedValues.js"

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class CIDUtil {
   /**
    * Parses a CID string into a CID object.
    * Attempts standard parsing first, then falls back to base58btc.
    *
    * @param cidStr - The CID string to parse
    * @returns The parsed CID object
    */
   static parseCID(
      cidStr: string,
      isBase58Btc?: boolean,
   ): { cidStr: CIDString; cid: CID } {
      CIDUtil.trustCID(cidStr)
      switch (isBase58Btc) {
         case true:
            return { cidStr, cid: CID.parse(cidStr, base58btc) }
         case false:
            return { cidStr, cid: CID.parse(cidStr) }
         default:
            try {
               return { cidStr, cid: CID.parse(cidStr) }
            } catch (_err) {
               return { cidStr, cid: CID.parse(cidStr, base58btc) }
            }
      }
   }

   /**
    * Validates that a string is a well-formed CID.
    *
    * This is a type guard that narrows `string` to `CIDString` (a nominal type
    * indicating the string has been validated as a legitimate CID format).
    *
    * @param cidString - The string to validate
    * @returns True if the string is a valid CID format
    */
   static verifyCID(
      cidString: string,
      isBase58Btc?: boolean,
   ): asserts cidString is CIDString {
      CIDUtil.parseCID(cidString, isBase58Btc)
   }

   /**
    * When using an unverified string as a CID, it may be preferable to just try to
    * use the string by parsing it than to have it blessed before parsing it for its
    * values since that will just parse the string twice with no extra value for the
    * effort.   This routine can be used to teach the compiler what was learned by a
    * successful prior parsing of some string.
    *
    * @param cidString An unverified string the caller believes will contain a
    *                  validly formatted CID without asserting that it must be valid.
    */
   static presumeCID(cidString: string): asserts cidString is LiteCIDString {}

   /**
    * When using an unverified string as a CID, it may be preferable to just try to
    * use the string by parsing it than to have it blessed before parsing it for its
    * values since that will just parse the string twice with no extra value for the
    * effort.   This routine can be used to teach the compiler what was learned by a
    * successful prior parsing of some string.
    *
    * @param cidString A _previously_ validated_ string the caller promises can be
    *                  trusted to contain a validly formatted CID.
    */
   static trustCID(cidString: string): asserts cidString is CIDString {}

   /**
    * Converts a validated CIDString or presumed validated to a CID object.
    *
    * @param cidString - The validated CID string
    * @returns The CID object
    */
   static maybeToCID(
      cidString: LiteCIDString | CIDString,
      isBase58Btc?: boolean,
   ): CID {
      return CIDUtil.parseCID(cidString, isBase58Btc).cid
   }

   /**
    * Converts a validated CIDString or to a CID object.
    *
    * @param cidString - The validated CID string
    * @returns The CID object
    */
   static toCID(
      cidString: LiteCIDString | CIDString,
      isBase58Btc?: boolean,
   ): CID {
      return CIDUtil.parseCID(cidString, isBase58Btc).cid
   }

   /**
    * Converts a CID object to a CIDString.
    *
    * @param cid - The CID object
    * @returns The CID as a validated CIDString
    */
   static fromCID(cid: CID): CIDString {
      const retVal = cid.toString()
      CIDUtil.trustCID(retVal)
      return retVal
   }
}
