/**
 * Trigram Context Module exports
 *
 * Provides context composition for Trigram painting with expression-based
 * filename generation that works on worker nodes without Trigram code.
 */

export {
   // Task mapping
   mapTrigramTaskToContextProperties,
   type TrigramContextMapping,
   // Pre-built modules
   TrigramBasicContextModule,
   TrigramProjectContextModule,
   TrigramFullContextModule,
   // Re-exports
   CONTEXT_FACTORY_TOKEN,
   FILE_STORE_TOKEN,
   type IContextFactory,
   type BaseTaskProperties,
   type ProjectIdentityProperties,
   type IFileStore,
} from "./TrigramContextModule.js"
