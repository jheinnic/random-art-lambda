import { Type } from "@nestjs/common"
import {
   type ExtensionDefinitionV2,
   DependencyResolver,
   type DataPropertiesOf,
} from "./ExtensionFactoryV2.js"
import { MiddlewareHandler } from "./MiddlewareHandler.js"
import { MiddlewareResult } from "./MiddlewareResult.js"
import { JobDisposition } from "./JobDisposition.js"

/**
 * Builder for constructing a type-safe middleware chain with dependency injection.
 *
 * This version (V2) combines:
 * - Explicit dependency injection for application middleware (predictable, testable)
 * - Super-delegate pattern for framework middleware (needs to see all extensions)
 *
 * Usage:
 * ```typescript
 * const builder = new MiddlewareChainBuilderV2(baseContext)
 *    .add(CampaignExt, campaignHandler)     // Application middleware with DI
 *    .add(StorageExt, storageHandler)       // Application middleware with DI
 *    .add(NameByExt, nameByHandler)         // Framework middleware sees all
 *
 * const finalContext = await builder.execute()
 * ```
 *
 * Key differences from V1:
 * - Uses ExtensionDefinitionV2 with explicit dependency types
 * - DependencyResolver manages instance lifecycle
 * - Extensions declare their dependencies explicitly
 * - No non-deterministic cross-extension calls
 */
export class MiddlewareChainBuilderV2<
   TBase extends object,
   TAccumulated extends object = TBase,
> {
   private readonly steps: Array<MiddlewareStepV2<any, any>> = []
   private readonly resolver: DependencyResolver

   constructor(
      private readonly baseContext: TBase,
      private readonly baseType: Type<TBase>,
   ) {
      this.resolver = new DependencyResolver()
      this.resolver.registerBase(baseType, baseContext)
   }

   /**
    * Add a middleware handler with its extension definition to the chain.
    *
    * The extension's dependencies will be automatically resolved from the
    * DependencyResolver when the chain executes.
    *
    * @template TBlueprint - The extension implementation class
    * @template TInterface - The extension interface type
    * @param extensionDef - Extension definition from defineExtensionV2()
    * @param handler - Middleware handler that processes this extension
    * @returns Builder with accumulated type TAccumulated & TInterface
    */
   add<TBlueprint extends object, TInterface = TBlueprint>(
      extensionDef: ExtensionDefinitionV2<TBase, TBlueprint, TInterface>,
      handler: MiddlewareHandler<any, any>,
   ): MiddlewareChainBuilderV2<TBase, TAccumulated & TInterface> {
      const step: MiddlewareStepV2<TBlueprint, TInterface> = {
         extensionDef,
         handler,
      }

      // TypeScript widening
      const nextBuilder = this as any as MiddlewareChainBuilderV2<
         TBase,
         TAccumulated & TInterface
      >
      nextBuilder.steps.push(step)

      return nextBuilder
   }

   /**
    * Execute the middleware chain with dependency injection.
    *
    * At each step:
    * 1. Build extension instance using DependencyResolver (auto-injects dependencies)
    * 2. Create super-delegate that combines base + accumulated data + all extension methods
    * 3. Pass super-delegate to middleware handler (for framework middleware)
    * 4. Merge result.model into accumulated context
    * 5. Register extension instance for future dependency resolution
    *
    * This approach supports both:
    * - Application middleware with explicit DI (extensions call injected dependencies)
    * - Framework middleware with super-delegate (needs to see all accumulated extensions)
    *
    * @returns Final accumulated delegate with all extensions applied
    */
   async execute(): Promise<TAccumulated> {
      let accumulated: any = { ...this.baseContext }
      const allExtensionInstances: any[] = []

      for (const step of this.steps) {
         const { extensionDef, handler } = step

         // Create super-delegate for framework middleware (with current accumulated state)
         // This gives framework handlers access to all accumulated data and methods
         const delegate = this.createSuperDelegate(
            { ...this.baseContext, ...accumulated },
            allExtensionInstances,
         )

         // Execute middleware with super-delegate
         const result: MiddlewareResult<any, any> = await handler.handle(
            delegate,
            undefined as any, // Parser removed
         )

         // Check disposition
         if (result.disposition !== JobDisposition.OK) {
            return {
               ...accumulated,
               disposition: result.disposition,
               error: (result as any).error,
            } as TAccumulated
         }

         // Accumulate model additions
         if ((result as any).model) {
            accumulated = {
               ...accumulated,
               ...(result as any).model,
            }
         }

         // NOW build extension instance with accumulated data (includes handler's output)
         // The resolver automatically injects dependencies from previous steps
         const extensionInstance = this.resolver.build(extensionDef, accumulated)

         // Track extension instance
         allExtensionInstances.push(extensionInstance)

         // Register extension instance so future steps can depend on it
         this.resolver.registerBase(
            extensionDef.Implementation,
            extensionInstance,
         )
      }

      // Create final super-delegate
      const superDelegate = this.createSuperDelegate(
         accumulated,
         allExtensionInstances,
      )
      return superDelegate as TAccumulated
   }

   /**
    * Create a super-delegate that combines all extension instances.
    *
    * The super-delegate is a Proxy that:
    * - Provides access to all accumulated data
    * - Provides access to all extension methods
    * - Methods are bound to their extension instance (proper `this` binding)
    *
    * This is essential for framework middleware that needs to see the "forest"
    * of all extensions (e.g., NameByMiddleware, FilterByMiddleware).
    */
   private createSuperDelegate(accumulated: any, extensions: any[]): any {
      const superDelegate = new Proxy(accumulated, {
         get(target, prop, receiver) {
            // 1. Check accumulated data first
            if (prop in target) {
               return Reflect.get(target, prop, receiver)
            }

            // 2. Check all extension instances for methods
            for (const extension of extensions) {
               if (prop in extension) {
                  const value = extension[prop as keyof typeof extension]
                  if (typeof value === "function") {
                     // Bind to extension instance (not receiver!)
                     // This preserves proper `this` for extension methods
                     return value.bind(extension)
                  }
                  return value
               }
            }

            return undefined
         },

         has(target, prop) {
            if (prop in target) return true
            for (const extension of extensions) {
               if (prop in extension) return true
            }
            return false
         },

         ownKeys(target) {
            const keys = new Set(Reflect.ownKeys(target))
            for (const extension of extensions) {
               for (const key of Reflect.ownKeys(extension)) {
                  keys.add(key)
               }
            }
            return Array.from(keys)
         },
      })

      return superDelegate
   }
}

/**
 * Internal step in the middleware chain.
 */
interface MiddlewareStepV2<TBlueprint extends object, TInterface> {
   extensionDef: ExtensionDefinitionV2<any, TBlueprint, TInterface>
   handler: MiddlewareHandler<any, any>
}
