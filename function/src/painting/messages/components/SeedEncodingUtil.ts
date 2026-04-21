/**
 * Seed Encoding Utilities
 *
 * Provides functions for identifying strings that are formatted as base64url encoded strings and transforming other
 * seeds and for re-encoding strings in other encodings as their base64url
 * equivalents with branding  branding strings into seed prefix/suffix formats.
 * This module is intentionally lightweight and does not depend on CID/IPFS libraries,
 * making it suitable for use in application-level code that needs to prepare
 * seed data without pulling in heavy dependencies like multiformats.
 */

import type {
   AnyAffixData,
   AnyAffixString,
   PrefixData,
   PrefixString,
   SuffixData,
   SuffixString,
} from "../values/PaintingNamedValues.js"

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class SeedEncodingUtil {
   /**
    * Validates that a string is a valid base64url-encoded string and tags it
    * for use as both a prefix and a suffix.
    *
    * @param str - The string to validate
    * @returns True if the string is valid base64url format
    */
   static blessAnyAffix(str: string): str is AnyAffixString {
      const buffer = Buffer.from(str, "base64url")
      const roundTrip = buffer.toString("base64url")
      return str === roundTrip
   }

   /**
    * Validates that a string is a valid base64url-encoded string and tags it
    * for use as a prefix.
    *
    * @param str - The string to validate
    * @returns True if the string is valid base64url format
    */
   static blessPrefix(str: string): str is PrefixString {
      return SeedEncodingUtil.blessAnyAffix(str)
   }

   /**
    * Validates that a string is a valid base64url-encoded string and tags it
    * for use as a suffix.
    *
    * @param suffixString - The string to validate
    * @returns True if the string is valid base64url format
    */
   static blessSuffix(suffixString: string): suffixString is SuffixString {
      return SeedEncodingUtil.blessAnyAffix(suffixString)
   }

   /**
    * Re-encodes an arbitrary string as its base64url equivalent and tags it for valid
    * use as a GenModel Suffix.
    *
    * The string is always re-encoded, even if it is advertised as base64url.  This
    * is done because any input that does not match its specified encoding will get
    * truncated on a round-trip re-encoding.  Always returning a new string ensures
    * that "base64url" behavior is consistent with other encodings and yields a result
    * that will maintain compatibility if later passed to one of the `bless` type guards.
    *
    * @param str - The arbitrary string to encode
    * @param encoding - The source encoding (default: "utf-8")
    * @returns The base64url re-encoded string, branded for use as both as a Prefix and
    *          as a Suffix,
    */
   static fromEncodedAnyAffix(
      str: string,
      encoding: BufferEncoding = "utf-8",
   ): AnyAffixString {
      return Buffer.from(str, encoding).toString("base64url") as AnyAffixString
   }

   /**
    * Re-encodes an arbitrary string as its base64url equivalent and tags it for valid
    * use as a GenModel Prefix.
    *
    * The string is always re-encoded, even if it is advertised as base64url.  This
    * is done because any input that does not match its specified encoding will get
    * truncated on a round-trip re-encoding.  Always returning a new string ensures
    * that "base64url" behavior is consistent with other encodings and yields a result
    * that will maintain compatibility if later passed to one of the `bless` type guards.
    *
    * @param suffixString - The arbitrary string to encode
    * @param encoding - The source encoding (default: "utf-8")
    * @returns The base64url re-encoded string, branded for use as a Prefix.
    */
   static fromEncodedPrefix(
      prefixString: string,
      encoding: BufferEncoding = "utf-8",
   ): PrefixString {
      return SeedEncodingUtil.fromEncodedAnyAffix(prefixString, encoding)
   }

   /**
    * Re-encodes an arbitrary string as its base64url equivalent and tags it for valid
    * use as a GenModel Suffix.
    *
    * The string is always re-encoded, even if it is advertised as base64url.  This
    * is done because any input that does not match its specified encoding will get
    * truncated on a round-trip re-encoding.  Always returning a new string ensures
    * that "base64url" behavior is consistent with other encodings and yields a result
    * that will maintain compatibility if later passed to one of the `bless` type guards.
    *
    * @param suffixString - The arbitrary string to encode
    * @param encoding - The source encoding (default: "utf-8")
    * @returns The base64url re-encoded string, branded for use as a Suffix.
    */
   static fromEncodedSuffix(
      suffixString: string,
      encoding: BufferEncoding = "utf-8",
   ): SuffixString {
      return SeedEncodingUtil.fromEncodedAnyAffix(suffixString, encoding)
   }

   /**
    * Casts PrefixString or SuffixString to be usable as both.
    *
    * This is used when a base64url string already tagged as either a Prefix or a
    * Suffix should be tagged for use as both a prefix and a suffix.
    *
    * @param term - The PrefixString or SuffixString to reuse
    * @returns term cast as both PrefixString & SuffixString (a.k.a AnyAffixString)
    * @see AnyAffixString
    */
   static reuseTerm(term: PrefixString | SuffixString): AnyAffixString {
      return term as AnyAffixString
   }

   /**
    * Casts PrefixData or SuffixData to be usable as both.
    *
    * This is used when a Uint8ClampedArray already tagged as either a Prefix
    * or a Suffix should be tagged for use as both a prefix and a suffix.
    *
    * @param data - The PrefixData or SuffixData to reuse
    * @returns data re-tagged as both PrefixData & SuffixData (a.k.a. AnyAffixData)
    * @see AnyAffixData
    */
   static reuseData(data: PrefixData | SuffixData): AnyAffixData {
      return data as AnyAffixData
   }

   static toAnyAffixData(affixString: AnyAffixString): AnyAffixData {
      const buffer = Buffer.from(affixString, "base64url")
      return new Uint8ClampedArray(buffer) as AnyAffixData
   }

   static fromAnyAffixData(anyAffixData: AnyAffixData): AnyAffixString {
      return Buffer.from(anyAffixData.buffer).toString(
         "base64url",
      ) as AnyAffixString
   }

   static toPrefixData(prefixString: PrefixString): PrefixData {
      return SeedEncodingUtil.toAnyAffixData(
         SeedEncodingUtil.reuseTerm(prefixString),
      )
   }

   static fromPrefixData(prefixData: PrefixData): PrefixString {
      return SeedEncodingUtil.fromAnyAffixData(
         SeedEncodingUtil.reuseData(prefixData),
      )
   }

   static toSuffixData(suffixString: SuffixString): SuffixData {
      return SeedEncodingUtil.toAnyAffixData(
         SeedEncodingUtil.reuseTerm(suffixString),
      )
   }

   static fromSuffixData(suffixData: SuffixData): SuffixString {
      return SeedEncodingUtil.fromAnyAffixData(
         SeedEncodingUtil.reuseData(suffixData),
      )
   }
}
