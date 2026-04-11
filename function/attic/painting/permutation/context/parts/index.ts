/**
 * Permutation Context Parts
 *
 * L2 context parts for the permutation framework. These provide
 * encoding declaration and term reconstruction independently of
 * path naming concerns.
 *
 * - **DeclareEncodingPart**: Provides inputEncoding for term reconstruction
 * - **TermFunctionsPart**: Provides expression functions that reconstruct
 *   original terms from binary seeds + declared encoding
 *
 * These parts can be composed with any other context parts -- they do
 * not require path naming or file staging to be present.
 */

// ============================================================================
// Declare Encoding Part
// ============================================================================

export {
   // Abstract contract
   HasDeclaredEncoding,
   // Concrete provider
   DeclareEncodingPart,
   // Types
   type DeclaredEncodingProperties,
} from "./DeclareEncodingPart.js"

// ============================================================================
// Term Functions Part
// ============================================================================

export {
   // Abstract contract
   HasTermFunctions,
   // Concrete provider
   TermFunctionsPart,
   // Types
   type TermMethods,
   type TermExpressionContext,
} from "./TermFunctionsPart.js"
