import * as crypto from "crypto"
import { BaseTaskModel } from "../types/BaseTaskModel.js"

/**
 * Built-in expression functions for filename resolution.
 *
 * These functions are available in filename expressions and receive
 * the BaseTaskModel as their execution context.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class BuiltInFunctions {
   /**
    * Generate content hash from buffer.
    *
    * @returns Base64-encoded SHA-256 hash (URL-safe: / + = replaced with _)
    *
    * @example
    * contentHash()      // Returns sha256 hash
    */
   static contentHash(this: BaseTaskModel): string {
      const data: Buffer = this.canvas!.toBuffer("image/png", {
         compressionLevel: 7,
      })
      return crypto.createHash("sha256").update(data).digest("base64url")
   }

   /**
    * Decode base64-encoded UTF-8 prefix bytes to string.
    *
    * Useful for decoding seedPrefix when they contain UTF-8 text
    * (though typically they're binary seeds).
    *
    * @returns Decoded UTF-8 string
    *
    * @example
    * prefixAsUtf8()
    */
   static prefixAsUtf8(this: BaseTaskModel): string {
      const buffer: Buffer = Buffer.from(this.seedPrefix, "base64")
      return buffer.toString("utf8")
   }

   /**
    * Decode base64-encoded UTF-8 suffix bytes to string.
    *
    * Useful for decoding seedSuffix when they contain UTF-8 text
    * (though typically they're binary seeds).
    *
    * @returns Decoded UTF-8 string
    *
    * @example
    * suffixAsUtf8()
    */
   static suffixAsUtf8(this: BaseTaskModel): string {
      const buffer: Buffer = Buffer.from(this.seedSuffix, "base64")
      return buffer.toString("utf8")
   }

   static prefixHash(this: BaseTaskModel): string {
      return crypto
         .createHash("sha256")
         .update(this.seedPrefix)
         .digest("base64url")
   }

   static suffixHash(this: BaseTaskModel): string {
      return crypto
         .createHash("sha256")
         .update(this.seedSuffix)
         .digest("base64url")
   }

   static prefixAndSuffixHash(this: BaseTaskModel): string {
      return crypto
         .createHash("sha256")
         .update(this.seedPrefix)
         .update("randomArt")
         .update(this.seedSuffix)
         .digest("base64url")
   }

   /**
    * Trim string to specified length.
    *
    * @param str - String to trim
    * @param maxLength - Maximum length
    * @returns Trimmed string
    *
    * @example
    * trim(contentHash(64), 12)  // Hash then trim to 12 chars
    * trim(asUtf8(seedPrefix), 8)
   static trim(this: BaseTaskModel, str: string, maxLength: number): string {
     return str.slice(0, maxLength)
   }
   */
   static pngBuffer(this: BaseTaskModel): Buffer {
      return this.canvas!.toBuffer("image/png", { compressionLevel: 9 })
   }

   /**
    * Get buffer size in bytes.
    *
    * @returns Buffer length in bytes
    *
    * @example
    * fileSize()  // Returns buffer.length
    */
   static fileSize(
      // this: DelegateForExtension<typeof BuiltInFunctions, BaseTaskModel>,
      this: BaseTaskModel,
   ): number {
      const pngBuffer = BuiltInFunctions.pngBuffer.bind(this)
      return pngBuffer().length
   }

   /**
    * Reverse lookup: Find name for a regionMapCID.
    *
    * Searches the collection's regionMapNames mapping for a name
    * corresponding to the given CID.
    *
    * @param cid - CID to look up (defaults to current item's regionMapCID)
    * @returns Human-readable name if found, otherwise the CID itself
    *
    * @example
    * regionMapName()              // Lookup current item's CID
    * regionMapName("QmABC...")    // Lookup specific CID
    */
   static regionMapName(this: BaseTaskModel): string {
      if (this.regionMapName != null && this.regionMapName.length > 0) {
         return this.regionMapName
      }
      return this.regionMapCID
      /*
      const targetCID = cid ?? this.metadata.regionMapCID
      const regionMapNames = this.collection?.regionMapNames

      if (!regionMapNames) {
         return targetCID
      }

      // Reverse lookup: find key where value === targetCID
      for (const [name, mappedCID] of Object.entries(regionMapNames)) {
         if (mappedCID === targetCID) {
            return name
         }
      }

      return targetCID
      */
   }

   /**
    * Access custom data properties.
    *
    * @param key - Key in customData object
    * @returns Value from customData, or undefined if not present
    *
    * @example
    * custom("s3Uri")      // Access ctx.customData.s3Uri
    * custom("localPath")  // Access ctx.customData.localPath
   static custom(this: BaseTaskModel, key: string): any {
      return this.customData?.[key]
   }
    */

   /**
    * Get zero-based image index within collection.
    *
    * @returns Image index, or undefined if not part of collection
    *
    * @example
    * imageIndex()  // Returns 0, 1, 2, etc.
    */
   static imageIndex(this: BaseTaskModel): number {
      if ("projectTaskIndex" in this) {
         return (this as { projectTaskIndex: number }).projectTaskIndex
      }
      return 0
   }

   /**
    * Get total number of images in collection.
    *
    * @returns Total images, or undefined if not part of collection
    *
    * @example
    * totalImages()  // Returns N
    */
   static totalImages(this: BaseTaskModel): number | undefined {
      // TODO: Wire up project context when available
      return 1
   }

   /**
    * Access metadata properties.
    *
    * @param key - Metadata key (width, height, seedPrefix, seedSuffix, regionMapCID)
    * @returns Metadata value
    *
    * @example
    * metadata("width")
    * metadata("height")
    * metadata("regionMapCID")
   static metadata(this: BaseTaskModel, key: keyof BaseTaskModel["metadata"]): any {
      return this.metadata[key]
   }
    */
}
