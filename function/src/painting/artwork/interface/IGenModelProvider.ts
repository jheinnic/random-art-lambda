/**
 * Abstract interface for generative art model providers.
 *
 * This abstraction allows switching between different generative art
 * implementations (e.g., genjs6 for personal use, randomart for
 * open-source distribution).
 */

/**
 * A generative art model that can compute pixel colors.
 *
 * Models are created from seed data and can evaluate color values
 * at any (x, y) coordinate in the model's coordinate space.
 */
export interface IGenModel {
   /**
    * Compute the RGB color at a given coordinate.
    *
    * @param x X coordinate (typically in range [-1, 1] or similar)
    * @param y Y coordinate (typically in range [-1, 1] or similar)
    * @returns RGB color tuple [red, green, blue], each 0-255
    */
   computePixel(x: number, y: number): [number, number, number]
}

/**
 * Provider interface for creating generative art models.
 *
 * Implementations wrap specific art generation libraries (genjs6, randomart, etc.)
 * and provide a consistent interface for the painting system.
 */
export interface IGenModelProvider {
   /**
    * Unique identifier for this provider (e.g., "genjs6", "randomart").
    */
   readonly providerId: string

   /**
    * Create a generative model from seed bytes.
    *
    * @param prefix First part of the seed (typically 3 bytes for trigram)
    * @param suffix Second part of the seed (typically 3 bytes for trigram)
    * @returns A model that can compute pixel colors
    */
   createModel(
      prefix: Uint8ClampedArray | Uint8Array,
      suffix: Uint8ClampedArray | Uint8Array,
   ): IGenModel

   /**
    * Create a generative model from a phrase string.
    *
    * @param phrase A seed phrase
    * @returns A model that can compute pixel colors
    */
   createModelFromPhrase?(phrase: string): IGenModel
}

/**
 * Token for injecting the configured IGenModelProvider.
 */
export const GEN_MODEL_PROVIDER = Symbol("IGenModelProvider")
