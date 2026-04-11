// =============================================================================
// Alternative: Pipeline with Runtime State Accumulation
// =============================================================================

/**
 * A middleware that can PRODUCE state at runtime, not just consume it.
 * - Requires: state that must exist before this middleware runs
 * - Produces: state this middleware will add to the context
 * - Methods: the API exposed after binding
 */
export interface ProducerMiddleware<
   Requires extends object,
   Produces extends object,
   Methods extends object,
> {
   readonly _requires: Requires
   readonly _produces: Produces

   /**
    * Called during pipeline execution.
    * Receives accumulated state so far, returns the state this middleware produces.
    */
   produce: (accumulated: Requires) => Produces | Promise<Produces>

   /**
    * Bind to the full context (Requires + Produces) to get methods.
    */
   bind: (context: Extend<Produces, Requires>) => Methods

   prototype: Methods
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Loose constraint for producer middleware.
 * Uses explicit any for bind to avoid Extend<any,any> index signature issues.
 */
interface AnyProducerMiddleware {
   readonly _requires: unknown
   readonly _produces: unknown
   produce: (accumulated: any) => any
   bind: (context: any) => any
   prototype: unknown
}

/** Extract Requires from _requires type marker */
type ProducerRequiresOf<T> = T extends {
   readonly _requires: infer R extends object
}
   ? R
   : never
/** Extract Produces from _produces type marker */
type ProducerProducesOf<T> = T extends {
   readonly _produces: infer P extends object
}
   ? P
   : never
/** Extract Methods from prototype */
type ProducerMethodsOf<T> = T extends { prototype: infer M extends object }
   ? M
   : never
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * A pipeline that accumulates state as it runs through middleware.
 * Tracks both the initial state (what you provide) and accumulated state (after derivations).
 */
interface Pipeline<
   InitialState extends object,
   AccumulatedState extends object,
   CombinedMethods extends object,
> {
   /**
    * Add a middleware to the pipeline.
    * The middleware's requirements must be satisfied by accumulated state.
    */
   use: <MW extends AnyProducerMiddleware>(
      middleware: MW,
   ) => AccumulatedState extends ProducerRequiresOf<MW>
      ? Pipeline<
           InitialState, // Initial state stays the same
           Extend<ProducerProducesOf<MW>, AccumulatedState>, // Accumulated grows
           Extend<ProducerMethodsOf<MW>, CombinedMethods>
        >
      : never

   /**
    * Execute the pipeline with initial state.
    * Each middleware's produce() is called in order, accumulating state.
    * Returns the bound methods with full accumulated context.
    */
   run: (initialState: InitialState) => Promise<CombinedMethods>
}

function _createPipeline(): Pipeline<{}, {}, {}> {
   return _createPipelineImpl([])
}

/**
 * Create a pipeline with a known initial/seed state type.
 * Use this when the first middleware requires specific input state.
 */
function createPipelineWithSeed<SeedState extends object>(): Pipeline<
   SeedState,
   SeedState,
   {}
> {
   return _createPipelineImpl([])
}

function _createPipelineImpl<
   Initial extends object,
   State extends object,
   Methods extends object,
>(middlewares: AnyProducerMiddleware[]): Pipeline<Initial, State, Methods> {
   const impl = {
      use: (middleware: AnyProducerMiddleware) => {
         return _createPipelineImpl([...middlewares, middleware])
      },

      run: async (initialState: Initial): Promise<Methods> => {
         // Accumulate state by running each middleware's produce()
         let accumulated: object = { ...initialState }

         for (const mw of middlewares) {
            const produced = await mw.produce(accumulated)
            accumulated = { ...accumulated, ...produced }
         }

         // Now bind all middleware to the fully accumulated state
         const methods: Methods = Object.assign(
            {},
            ...middlewares.map((mw) => mw.bind(accumulated)),
         ) as Methods

         return methods
      },
   }
   return impl as unknown as Pipeline<Initial, State, Methods>
}
