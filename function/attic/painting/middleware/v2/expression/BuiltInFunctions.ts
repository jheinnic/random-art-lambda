import * as crypto from "crypto"

/**
 * Minimal context interface for expression functions.
 * Applications can extend this with additional properties.
 */
export interface ExpressionContext {
   readonly seedPrefix: string
   readonly seedSuffix: string
   readonly regionMapName?: string
   readonly regionMapCID?: string
}

/**
 * Built-in expression functions for naming and hashing.
 *
 * These functions are available in expressions and receive
 * a context object with seed and region map information.
 *
 * For functions that need rendered image data (like contentHash),
 * the application should extend this class or provide the data
 * through the context.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class BuiltInFunctions {
   /**
    * Decode base64-encoded UTF-8 prefix bytes to string.
    *
    * @example prefixAsUtf8()
    */
   static prefixAsUtf8(this: ExpressionContext): string {
      const buffer: Buffer = Buffer.from(this.seedPrefix, "base64")
      return buffer.toString("utf8")
   }

   /**
    * Decode base64-encoded UTF-8 suffix bytes to string.
    *
    * @example suffixAsUtf8()
    */
   static suffixAsUtf8(this: ExpressionContext): string {
      const buffer: Buffer = Buffer.from(this.seedSuffix, "base64")
      return buffer.toString("utf8")
   }

   /**
    * SHA-256 hash of the seed prefix.
    *
    * @example prefixHash()
    */
   static prefixHash(this: ExpressionContext): string {
      return crypto
         .createHash("sha256")
         .update(this.seedPrefix)
         .digest("base64url")
   }

   /**
    * SHA-256 hash of the seed suffix.
    *
    * @example suffixHash()
    */
   static suffixHash(this: ExpressionContext): string {
      return crypto
         .createHash("sha256")
         .update(this.seedSuffix)
         .digest("base64url")
   }

   /**
    * Combined hash of prefix + "randomArt" + suffix.
    * Useful for deterministic filename generation.
    *
    * @example prefixAndSuffixHash()
    */
   static prefixAndSuffixHash(this: ExpressionContext): string {
      return crypto
         .createHash("sha256")
         .update(this.seedPrefix)
         .update("randomArt")
         .update(this.seedSuffix)
         .digest("base64url")
   }

   /**
    * Get the human-readable region map name, falling back to CID.
    *
    * @example regionMapName()
    */
   static regionMapName(this: ExpressionContext): string {
      if (this.regionMapName != null && this.regionMapName.length > 0) {
         return this.regionMapName
      }
      return this.regionMapCID ?? "unknown"
   }
}

// Application developers can extend BuiltInFunctions with their own
// context-aware functions. See attic/expression for examples of
// image-buffer-aware functions that applications might implement.
