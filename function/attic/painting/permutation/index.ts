/**
 * Permutation Framework Module
 *
 * Provides term-aware context parts and convenience factories for
 * composing term awareness with expression-based path naming.
 *
 * ## Architecture (L2/L3)
 *
 * **L2 Parts** (independently composable):
 * - DeclareEncodingPart + TermFunctionsPart: Encoding declaration + term reconstruction
 * - createResolvedPathPart (from middleware): Expression-resolved paths
 *
 * **L3 Convenience** (composes both L2 concerns):
 * - createPermutationContextModule: Full term + path composition
 *
 * ## Interfaces
 *
 * Domain applications extend these base interfaces:
 * - PermutationInputSpec: For permutation-level specs
 * - PermutationProjectSpec: For project-level specs
 * - PermutationPaintTask: For paint task domain extensions
 */

// Interfaces
export * from "./interface/index.js"

// Context Parts (L2)
export * from "./context/parts/index.js"

// L3 Convenience Factory
export { createPermutationContextModule, type PermutationContextModuleOptions } from "./compose/PermutationContextModuleFactory.js"
