/**
 * Middleware Context Module Builder
 *
 * Integrates the Context Part system with NestJS dependency injection.
 * Creates a dynamic module that:
 * - Validates context part assemblies at module initialization
 * - Wires up injection-backed parts with NestJS providers
 * - Creates a ContextFactory provider for runtime assembly
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
   DynamicModule,
   Module,
   Provider,
   InjectionToken,
   Logger,
} from "@nestjs/common"

import {
   type ContextPartConstructor,
   type ContextPartMetadata,
   getContextPartMetadata,
} from "./ContextPartMetadata.js"
import {
   ContextPartRegistry,
   globalContextPartRegistry,
   type AssemblyValidationResult,
   type DependencyGraph,
   ValidationErrorType,
} from "./ContextPartRegistry.js"
import {
   type MiddlewareContextConstructor,
   type MiddlewareContext,
   mergeConstructors,
} from "./Contextualize.js"
import {
   InjectionResolver,
   type InjectionToken as PartInjectionToken,
} from "./InjectedContextPart.js"
import {
   ExpressionResolver,
   type ExpressionContext,
} from "./ExpressionContextPart.js"

// ============================================================================
// Module Configuration Types
// ============================================================================

/**
 * Configuration for the middleware context module
 */
export interface MiddlewareContextModuleConfig {
   /** The context parts to assemble (concrete parts only) */
   readonly parts: ContextPartConstructor[]
   /** Whether to use the global registry for validation */
   readonly useGlobalRegistry?: boolean
   /** Optional: Custom registry instance */
   readonly registry?: ContextPartRegistry
   /** Whether this module should be global */
   readonly global?: boolean
}

/**
 * Token for the assembled context factory
 */
export const CONTEXT_FACTORY_TOKEN = Symbol("MiddlewareContextFactory")

/**
 * Token for the dependency graph
 */
export const DEPENDENCY_GRAPH_TOKEN = Symbol("ContextDependencyGraph")

// ============================================================================
// Context Factory
// ============================================================================

/**
 * Factory for creating assembled middleware contexts at runtime.
 *
 * This is provided by the module and used by workers/consumers to create
 * context instances with all dependencies resolved.
 */
export interface IContextFactory<
   TContext extends object = object,
   TDeps extends object = object,
> {
   /**
    * Create a new context instance with the given initial state.
    *
    * @param initialState - Initial values for the context
    * @returns A fully assembled middleware context
    */
   create: (
      initialState: Partial<TContext>,
   ) => MiddlewareContext<TContext, TDeps>

   /**
    * Get the dependency graph used for assembly
    */
   getDependencyGraph: () => DependencyGraph
}

/**
 * Implementation of the context factory
 */
class ContextFactoryImpl<
   TContext extends object = object,
   TDeps extends object = object,
> implements IContextFactory<TContext, TDeps>
{
   private readonly logger = new Logger("ContextFactory")

   constructor(
      private readonly assembledConstructor: MiddlewareContextConstructor<
         TContext,
         TDeps
      >,
      private readonly dependencyGraph: DependencyGraph,
      private readonly resolvedInjections: Map<string, object>,
      private readonly expressionContext: ExpressionContext,
   ) {}

   create(initialState: Partial<TContext>): MiddlewareContext<TContext, TDeps> {
      // Build context args array
      const contextArgs: object[] = [initialState]

      // Build dependency args array from resolved injections
      const depArgs: object[] = Array.from(this.resolvedInjections.values())

      // Create instance
      const instance = new this.assembledConstructor(contextArgs, ...depArgs)

      // Evaluate any expression-backed properties
      for (const part of this.dependencyGraph.orderedParts) {
         if (ExpressionResolver.hasExpressions(part)) {
            const evaluated = ExpressionResolver.evaluateExpressions(
               part,
               this.expressionContext,
            )
            Object.assign(instance.context, evaluated)
         }
      }

      return instance
   }

   getDependencyGraph(): DependencyGraph {
      return this.dependencyGraph
   }
}

// ============================================================================
// Module Builder
// ============================================================================

/**
 * Builder for creating NestJS dynamic modules that wire up context parts.
 *
 * @example
 * ```typescript
 * // Define your parts
 * const BaseTaskContext = publicContextualize(BaseTaskModel, { name: "BaseTask" })
 *
 * const InjectedFileStorePart = createInjectedPart<{ fileStore: IFileStore }>(
 *    HasFileStore,
 *    { name: "InjectedFileStorePart", provides: [HasFileStore], injections: { fileStore: FILE_STORE_TOKEN } }
 * )
 *
 * const StagingActivity = activityContextualize(
 *    ImageStagingActivity,
 *    ["stagedPath"],
 *    ["fileStore"],
 *    { name: "StagingActivity", dependsOn: [HasFileStore] }
 * )
 *
 * // Create the module
 * const ContextModule = MiddlewareContextModuleBuilder
 *    .create("PaintingContextModule")
 *    .addParts([BaseTaskContext, InjectedFileStorePart, StagingActivity])
 *    .withDependency(FILE_STORE_TOKEN, S3FileStore)
 *    .build()
 *
 * // Use in your app
 * @Module({
 *    imports: [ContextModule.forRoot()],
 * })
 * export class AppModule {}
 * ```
 */
export class MiddlewareContextModuleBuilder {
   private readonly parts: ContextPartConstructor[] = []
   private readonly dependencyBindings: Map<
      PartInjectionToken,
      InjectionToken | Provider
   > = new Map()

   private moduleName: string = "MiddlewareContextModule"
   private isGlobal: boolean = false
   private registry: ContextPartRegistry = globalContextPartRegistry

   private constructor() {}

   /**
    * Start building a new middleware context module
    */
   static create(moduleName?: string): MiddlewareContextModuleBuilder {
      const builder = new MiddlewareContextModuleBuilder()
      if (moduleName != null) {
         builder.moduleName = moduleName
      }
      return builder
   }

   /**
    * Add context parts to be assembled
    */
   addParts(parts: ContextPartConstructor[]): this {
      this.parts.push(...parts)
      return this
   }

   /**
    * Add a single context part
    */
   addPart(part: ContextPartConstructor): this {
      this.parts.push(part)
      return this
   }

   /**
    * Bind an injection token to a provider or another token
    */
   withDependency(
      token: PartInjectionToken,
      providerOrToken: InjectionToken | Provider,
   ): this {
      this.dependencyBindings.set(token, providerOrToken)
      return this
   }

   /**
    * Use a custom registry instead of the global one
    */
   withRegistry(registry: ContextPartRegistry): this {
      this.registry = registry
      return this
   }

   /**
    * Make the module global
    */
   global(): this {
      this.isGlobal = true
      return this
   }

   /**
    * Build the dynamic module class
    */
   build(): {
      forRoot: () => DynamicModule
   } {
      const parts = [...this.parts]
      const dependencyBindings = new Map(this.dependencyBindings)
      const moduleName = this.moduleName
      const isGlobal = this.isGlobal
      const registry = this.registry

      // Create the module class
      @Module({})
      class GeneratedContextModule {
         static forRoot(): DynamicModule {
            const logger = new Logger(moduleName)

            // Validate assembly
            const validation = registry.validateForAssembly(parts)
            if (!validation.isValid) {
               const errorMessages = validation.errors
                  .map((e) => `  - ${e.type}: ${e.message}`)
                  .join("\n")
               throw new Error(
                  `Context assembly validation failed:\n${errorMessages}`,
               )
            }

            logger.log(
               `Validated assembly with ${validation.dependencyGraph.orderedParts.length} parts`,
            )

            // Build providers
            const providers: Provider[] = []

            // Create providers for dependency bindings
            for (const [token, binding] of Array.from(dependencyBindings)) {
               if (typeof binding === "object" && "provide" in binding) {
                  // It's a Provider object
                  providers.push(binding as Provider)
               } else {
                  // It's an InjectionToken - create an alias
                  providers.push({
                     provide: token as InjectionToken,
                     useExisting: binding as InjectionToken,
                  })
               }
            }

            // Create provider for the dependency graph
            providers.push({
               provide: DEPENDENCY_GRAPH_TOKEN,
               useValue: validation.dependencyGraph,
            })

            // Collect all injection tokens needed
            const injectionRequirements: Array<{
               part: ContextPartConstructor
               partName: string
               requirements: Array<{
                  propertyName: string
                  token: string | symbol
               }>
            }> = []

            for (const part of validation.dependencyGraph.orderedParts) {
               if (InjectionResolver.hasInjections(part)) {
                  const meta = getContextPartMetadata(part)
                  injectionRequirements.push({
                     part,
                     partName: meta?.name ?? part.name,
                     requirements:
                        InjectionResolver.getInjectionRequirements(part),
                  })
               }
            }

            // Build the inject array for the context factory
            const injectTokens: InjectionToken[] = [DEPENDENCY_GRAPH_TOKEN]
            for (const req of injectionRequirements) {
               for (const dep of req.requirements) {
                  if (!injectTokens.includes(dep.token as InjectionToken)) {
                     injectTokens.push(dep.token as InjectionToken)
                  }
               }
            }

            // Create the context factory provider
            providers.push({
               provide: CONTEXT_FACTORY_TOKEN,
               useFactory: (
                  dependencyGraph: DependencyGraph,
                  ...injectedServices: unknown[]
               ): IContextFactory => {
                  // Map tokens to resolved services
                  const tokenToService = new Map<string | symbol, unknown>()
                  injectTokens.slice(1).forEach((token, index) => {
                     // Store using a string/symbol key for lookup
                     const key =
                        typeof token === "function" ? token.name : token
                     tokenToService.set(key, injectedServices[index])
                  })

                  // Build resolved injections map
                  const resolvedInjections = new Map<string, object>()
                  for (const req of injectionRequirements) {
                     const resolved: Record<string, unknown> = {}
                     for (const dep of req.requirements) {
                        // Lookup using the same key format
                        resolved[dep.propertyName] = tokenToService.get(
                           dep.token,
                        )
                     }
                     resolvedInjections.set(req.partName, resolved as object)
                  }

                  // Merge all part constructors in dependency order
                  let mergedConstructor:
                     | MiddlewareContextConstructor<any, any>
                     | undefined
                  for (const part of dependencyGraph.orderedParts) {
                     if (mergedConstructor == null) {
                        mergedConstructor =
                           part as unknown as MiddlewareContextConstructor<
                              any,
                              any
                           >
                     } else {
                        mergedConstructor = mergeConstructors(
                           mergedConstructor,
                           part as unknown as MiddlewareContextConstructor<
                              any,
                              any
                           >,
                        )
                     }
                  }

                  if (mergedConstructor == null) {
                     throw new Error("No parts to assemble")
                  }

                  // Build expression context (will be populated when creating instances)
                  const expressionContext: ExpressionContext = {
                     context: {},
                     _methods: {},
                  }

                  return new ContextFactoryImpl(
                     mergedConstructor,
                     dependencyGraph,
                     resolvedInjections,
                     expressionContext,
                  )
               },
               inject: injectTokens,
            })

            // Build the dynamic module
            const dynamicModule: DynamicModule = {
               module: GeneratedContextModule,
               providers,
               exports: [CONTEXT_FACTORY_TOKEN, DEPENDENCY_GRAPH_TOKEN],
            }

            if (isGlobal) {
               dynamicModule.global = true
            }

            return dynamicModule
         }
      }

      // Set the module name
      Object.defineProperty(GeneratedContextModule, "name", {
         value: moduleName,
         writable: false,
         enumerable: false,
         configurable: true,
      })

      return GeneratedContextModule
   }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create a simple context module from a list of parts.
 *
 * This is a convenience function for the common case where you just
 * need to assemble parts without complex dependency bindings.
 */
export function createContextModule(
   moduleName: string,
   parts: ContextPartConstructor[],
   options?: {
      global?: boolean
      dependencies?: Map<PartInjectionToken, InjectionToken | Provider>
   },
): { forRoot: () => DynamicModule } {
   const builder =
      MiddlewareContextModuleBuilder.create(moduleName).addParts(parts)

   if (options?.global === true) {
      builder.global()
   }

   if (options?.dependencies != null) {
      for (const [token, binding] of Array.from(options.dependencies)) {
         builder.withDependency(token, binding)
      }
   }

   return builder.build()
}

/**
 * Validate a set of parts without creating a module.
 * Useful for testing and debugging assembly configurations.
 */
export function validateAssembly(
   parts: ContextPartConstructor[],
   registry: ContextPartRegistry = globalContextPartRegistry,
): AssemblyValidationResult {
   return registry.validateForAssembly(parts)
}

/**
 * Pretty-print assembly validation errors
 */
export function formatValidationErrors(
   result: AssemblyValidationResult,
): string {
   if (result.isValid) {
      return "Assembly is valid"
   }

   const lines = ["Assembly validation failed:"]
   for (const error of result.errors) {
      switch (error.type) {
         case ValidationErrorType.MISSING_PROVIDER:
            lines.push(
               `  ❌ Missing provider: ${error.dependencyName} (${error.message})`,
            )
            break
         case ValidationErrorType.DUPLICATE_PROVIDER:
            lines.push(
               `  ⚠️ Duplicate provider: ${error.dependencyName} (${error.message})`,
            )
            break
         case ValidationErrorType.CIRCULAR_DEPENDENCY:
            lines.push(
               `  🔄 Circular dependency: ${error.partName} (${error.message})`,
            )
            break
         case ValidationErrorType.UNKNOWN_DEPENDENCY:
            lines.push(
               `  ❓ Unknown dependency: ${error.partName} → ${error.dependencyName}`,
            )
            break
         case ValidationErrorType.ABSTRACT_IN_ASSEMBLY:
            lines.push(
               `  📋 Abstract part in assembly: ${error.partName} (${error.message})`,
            )
            break
         default:
            lines.push(`  ❌ ${error.type}: ${error.message}`)
      }
   }

   return lines.join("\n")
}
