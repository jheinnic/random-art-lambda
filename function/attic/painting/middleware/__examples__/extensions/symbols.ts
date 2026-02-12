/**
 * Symbol Properties for Non-Serializable State
 *
 * Symbols are:
 * - Not enumerable (won't show up in JSON.stringify)
 * - Not included in Object.keys() or for...in loops
 * - Perfect for caches and injected dependencies
 */

/**
 * Memoization caches (implementation details)
 */
export const CONTENT_HASH_CACHE = Symbol("contentHashCache")
export const COLOR_ANALYSIS_CACHE = Symbol("colorAnalysisCache")

/**
 * Injected dependencies (services)
 */
export const FILE_STORE = Symbol("fileStore")
export const GRAPH_DB = Symbol("graphDb")
export const LOGGER = Symbol("logger")
