import "reflect-metadata"

/**
 * Metadata keys for middleware step registration.
 * Using Symbols prevents collision with other libraries.
 */
export const MIDDLEWARE_STEP_KEY = Symbol("middleware:step")
export const MIDDLEWARE_PROVIDES_KEY = Symbol("middleware:provides")
export const MIDDLEWARE_REQUIRES_KEY = Symbol("middleware:requires")
export const MIDDLEWARE_CONTEXT_FIELD_KEY = Symbol("middleware:context-field")

/**
 * Registry of all middleware steps discovered at decoration time.
 * This is the "filing cabinet" that allows iteration over all steps.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class MiddlewareRegistry {
   private static readonly steps = new Map<Function, MiddlewareStepMetadata>()

   static register(
      constructor: Function,
      metadata: MiddlewareStepMetadata,
   ): void {
      this.steps.set(constructor, metadata)
   }

   static getMetadata(
      constructor: Function,
   ): MiddlewareStepMetadata | undefined {
      return this.steps.get(constructor)
   }

   static getAllSteps(): Array<[Function, MiddlewareStepMetadata]> {
      return Array.from(this.steps.entries())
   }

   /**
    * Build a dependency graph and return steps in execution order.
    * Throws if there are missing dependencies or cycles.
    */
   static getOrderedSteps(): Function[] {
      const allSteps = this.getAllSteps()
      const provided = new Set<string>()
      const ordered: Function[] = []
      const remaining = new Map(allSteps)

      // Iteratively find steps whose requirements are satisfied
      while (remaining.size > 0) {
         let progress = false

         for (const [constructor, metadata] of remaining) {
            const requiresSatisfied = metadata.requires.every((r) =>
               provided.has(r),
            )

            if (requiresSatisfied) {
               ordered.push(constructor)
               metadata.provides.forEach((p) => provided.add(p))
               remaining.delete(constructor)
               progress = true
            }
         }

         if (!progress && remaining.size > 0) {
            const missing = Array.from(remaining.values())
               .flatMap((m) => m.requires)
               .filter((r) => !provided.has(r))
            throw new Error(
               `Middleware chain has unsatisfied dependencies: ${missing.join(", ")}`,
            )
         }
      }

      return ordered
   }
}

/**
 * Metadata stored for each middleware step
 */
export interface MiddlewareStepMetadata {
   /** Human-readable name for logging/debugging */
   name: string

   /** Context fields this step provides (adds to the context) */
   provides: string[]

   /** Context fields this step requires (must exist before execution) */
   requires: string[]

   /** The constructor's parameter types (from design:paramtypes) */
   paramTypes: Function[]

   /** Field names and their expected context sources */
   contextFields: Map<string, ContextFieldMetadata>
}

export interface ContextFieldMetadata {
   /** The property name on the step class */
   propertyKey: string

   /** The context field name to inject from */
   contextSource: string

   /** The expected type (from design:type) */
   expectedType: Function
}

/**
 * Options for the @MiddlewareStep decorator
 */
export interface MiddlewareStepOptions {
   /** What context fields this step adds */
   provides: string[]

   /** What context fields this step needs */
   requires?: string[]

   /** Optional name override (defaults to class name) */
   name?: string
}

/**
 * Class decorator for middleware steps.
 *
 * @example
 * @MiddlewareStep({
 *   provides: ["regionMap"],
 *   requires: ["taskId", "cidRef"]
 * })
 * class LoadRegionMapStep implements IMiddlewareStep {
 *   @FromContext("cidRef")
 *   private cidRef: PlotDataCIDRef
 *
 *   async execute(ctx: MiddlewareContext<RequiredContext>): Promise<ProvidesRegionMap> {
 *     const regionMap = await this.repository.load(this.cidRef)
 *     return { regionMap }
 *   }
 * }
 */
export function MiddlewareStep(options: MiddlewareStepOptions) {
   return function <T extends { new (...args: any[]): object }>(
      constructor: T,
   ): T {
      // Get parameter types from TypeScript metadata
      const paramTypes: Function[] =
         Reflect.getMetadata("design:paramtypes", constructor) || []

      // Get any context field metadata already registered by @FromContext
      const contextFields: Map<string, ContextFieldMetadata> =
         Reflect.getOwnMetadata(
            MIDDLEWARE_CONTEXT_FIELD_KEY,
            constructor.prototype,
         ) || new Map()

      const metadata: MiddlewareStepMetadata = {
         name: options.name || constructor.name,
         provides: options.provides,
         requires: options.requires || [],
         paramTypes,
         contextFields,
      }

      // Store on the class itself for later retrieval
      Reflect.defineMetadata(MIDDLEWARE_STEP_KEY, metadata, constructor)

      // Register in the global registry for discovery
      MiddlewareRegistry.register(constructor, metadata)

      return constructor
   }
}

/**
 * Property decorator to inject a value from the middleware context.
 *
 * @example
 * class LoadRegionMapStep {
 *   @FromContext("cidRef")
 *   private cidRef: PlotDataCIDRef  // Will be injected at execution time
 * }
 */
export function FromContext(contextFieldName: string) {
   return function (target: object, propertyKey: string): void {
      // Get the field's type from design:type
      const expectedType = Reflect.getMetadata(
         "design:type",
         target,
         propertyKey,
      )

      // Get or create the context fields map
      const contextFields: Map<string, ContextFieldMetadata> =
         Reflect.getOwnMetadata(MIDDLEWARE_CONTEXT_FIELD_KEY, target) ||
         new Map()

      contextFields.set(propertyKey, {
         propertyKey,
         contextSource: contextFieldName,
         expectedType,
      })

      // Store back on the prototype
      Reflect.defineMetadata(
         MIDDLEWARE_CONTEXT_FIELD_KEY,
         contextFields,
         target,
      )
   }
}

/**
 * Retrieve step metadata from a class
 */
export function getStepMetadata(
   constructor: Function,
): MiddlewareStepMetadata | undefined {
   return Reflect.getMetadata(MIDDLEWARE_STEP_KEY, constructor)
}
