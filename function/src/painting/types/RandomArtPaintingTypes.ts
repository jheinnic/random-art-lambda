/**
 * Injection tokens for Random Art painting system
 */
export const RandomArtPaintingTypes = {
   /**
    * Item-level middleware chain executor
    * Processes individual images during child job execution
    */
   ItemMiddlewareChain: Symbol("ItemMiddlewareChain"),

   /**
    * Collection-level middleware chain executor
    * Processes collection of results during parent job execution
    */
   CollectionMiddlewareChain: Symbol("CollectionMiddlewareChain"),

   /**
    * Expression evaluator for dynamic filename generation
    */
   ExpressionEvaluator: Symbol("ExpressionEvaluator"),

   /**
    * LRU cache for buffer rehydration
    */
   BufferCache: Symbol("BufferCache"),

   /**
    * Flow producer for creating scatter-gather job flows
    */
   FlowProducer: Symbol("FlowProducer"),

   /**
    * Queue for random art painting jobs
    */
   PaintingQueue: Symbol("PaintingQueue"),
} as const
