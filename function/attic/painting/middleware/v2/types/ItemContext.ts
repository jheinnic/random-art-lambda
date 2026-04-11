import { ItemContextInput } from "./ItemContextInput.js"
import { ItemContextState } from "./ItemContextState.js"

/**
 * Combined context for item-level middleware.
 *
 * This is a convenience type that combines readonly input with mutable state.
 * Handlers can work with this unified type, but the separation makes it clear
 * which fields are immutable vs which can be modified.
 */
export type ItemContext = ItemContextInput & ItemContextState
