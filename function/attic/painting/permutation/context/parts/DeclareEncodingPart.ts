/**
 * Declare Encoding Context Part
 *
 * Provides the input encoding name to the context composition system.
 * This is the only wire data needed to reconstruct original input terms
 * from binary seeds -- TermFunctionsPart uses this encoding to decode
 * base64url binary seeds back into original strings on demand.
 *
 * Replaces the data-carrying EncodedTermsPart which shipped pre-transcoded
 * copies of the original terms alongside the binary seeds.
 */

import {
   ContextPart,
   publicContextualize,
   type ContextPartConstructor,
   type MiddlewareContextConstructor,
} from "../../../middleware/context/index.js"

// ============================================================================
// Declared Encoding Properties
// ============================================================================

/**
 * Properties for declaring the input encoding used to produce binary seeds.
 */
export interface DeclaredEncodingProperties {
   /** The encoding used for the original input terms */
   readonly inputEncoding: BufferEncoding
}

// ============================================================================
// Abstract Contract
// ============================================================================

/**
 * Abstract contract for parts that provide the declared input encoding.
 *
 * TermFunctionsPart depends on this contract to decode binary seeds
 * back into original term strings.
 */
@ContextPart({
   name: "HasDeclaredEncoding",
   isAbstract: true,
   visibility: "public",
})
export abstract class HasDeclaredEncoding {
   /** The encoding used for the original input terms */
   abstract readonly inputEncoding: BufferEncoding
}

// ============================================================================
// Concrete Provider
// ============================================================================

/**
 * Holder class for declared encoding property.
 */
class DeclaredEncodingHolder {
   inputEncoding!: BufferEncoding
}

/**
 * Contextualized DeclareEncoding part.
 *
 * Provides the input encoding to the context, enabling TermFunctionsPart
 * to reconstruct original term strings from binary seeds on demand.
 */
export const DeclareEncodingPart: MiddlewareContextConstructor<
   DeclaredEncodingProperties,
   object
> = publicContextualize(DeclaredEncodingHolder, {
   name: "DeclareEncodingPart",
   provides: [HasDeclaredEncoding as unknown as ContextPartConstructor],
   visibility: "public",
}) as MiddlewareContextConstructor<DeclaredEncodingProperties, object>
