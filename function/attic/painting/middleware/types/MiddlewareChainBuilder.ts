import { Type } from "@nestjs/common"
import {
   defineExtension,
   type ExtensionDefinition,
   type DelegateOf,
} from "./ExtensionFactory.js"
import { MiddlewareHandler } from "./MiddlewareHandler.js"
import { MiddlewareResult } from "./MiddlewareResult.js"
import { JobDisposition } from "./JobDisposition.js"

/**
 * Builder for constructing a type-safe middleware chain with accumulated model state.
 *
 * Instead of slicing type tuples, this builder uses intersection types to accumulate
 * model extensions at each step in the chain.
 *
 * Usage:
 * ```typescript
 * const builder = new MiddlewareChainBuilder(baseContext)
 *    .add(Campaign)     // Base & CampaignDelegate
 *    .add(Storage)      // Base & CampaignDelegate & StorageDelegate
 *    .add(Naming)       // Base & CampaignDelegate & StorageDelegate & NamingDelegate
 *
 * const finalContext = await builder.execute()
 * ```
 */
export class MiddlewareChainBuilder<
   TBase extends object,
   TAccumulated extends object = TBase,
> {
   private readonly steps: Array<MiddlewareStep<any, any, any>> = []

   constructor(private readonly baseContext: TBase) {}

   /**
    * Add a middleware handler with its extension definition to the chain.
    *
    * The extension is decomposed into DTO + Extension + Delegate, and the delegate
    * type is accumulated via intersection with the current accumulated type.
    *
    * @template TBlueprint - The extension class (naturally written with data + methods)
    * @template TDelegate - The unified delegate type (Base & DTO & methods)
    * @param extensionDef - Extension definition from defineExtension()
    * @param handler - Middleware handler that processes this extension
    * @returns Builder with accumulated type TAccumulated & TDelegate
    */
   add<TBlueprint extends TBase, TDelegate extends DelegateOf<TBase, TBlueprint>>(
      extensionDef: ExtensionDefinition<TBase, TBlueprint, TDelegate>,
      handler: MiddlewareHandler<any, any>,
   ): MiddlewareChainBuilder<TBase, TAccumulated & TDelegate> {
      const step: MiddlewareStep<TBase, TBlueprint, TDelegate> = {
         extensionDef,
         handler,
      }

      // TypeScript widening: we know the types are accumulating correctly
      // but we need to cast to maintain the builder chain
      const nextBuilder = this as any as MiddlewareChainBuilder<
         TBase,
         TAccumulated & TDelegate
      >
      nextBuilder.steps.push(step)

      return nextBuilder
   }

   /**
    * Execute the middleware chain, creating unified delegates at each step.
    *
    * At each step:
    * 1. Create DTO instance with data from previous step
    * 2. Create unified delegate (base + accumulated DTOs + all extensions)
    * 3. Pass delegate to middleware handler
    * 4. Merge result.model into accumulated context
    *
    * The final result is a super-delegate that combines ALL extensions.
    *
    * @returns Final accumulated delegate with all extensions applied
    */
   async execute(): Promise<TAccumulated> {
      let accumulated: any = this.baseContext
      const allExtensions: any[] = []

      for (const step of this.steps) {
         const { extensionDef, handler } = step

         // Track all extensions for cumulative super-delegate
         allExtensions.push(extensionDef.Extension)

         // Create DTO instance and populate from accumulated context
         const dto = new extensionDef.DTO()
         Object.assign(dto, accumulated)

         // Create cumulative super-delegate with ALL extensions so far
         // This ensures each middleware can use methods from previous steps
         const delegate = this.createSuperDelegate(
            { ...this.baseContext, ...accumulated },
            allExtensions,
         )

         // Execute middleware with cumulative delegate
         const result: MiddlewareResult<any, any> = await handler.handle(
            delegate,
            undefined as any, // Parser will be removed in next phase
         )

         // Check disposition
         if (result.disposition !== JobDisposition.OK) {
            // For non-OK, return accumulated context with disposition
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
      }

      // Create final super-delegate that merges ALL extensions
      const superDelegate = this.createSuperDelegate(accumulated, allExtensions)
      return superDelegate as TAccumulated
   }

   /**
    * Create a super-delegate that combines all extensions.
    *
    * This creates a Proxy that:
    * - Provides access to all accumulated data
    * - Provides access to all extension methods from the entire chain
    * - Methods are bound to the super-delegate so they can see all data/methods
    */
   private createSuperDelegate(accumulated: any, extensions: any[]): any {
      const superDelegate = new Proxy(accumulated, {
         get(target, prop, receiver) {
            // 1. Check accumulated data first
            if (prop in target) {
               return Reflect.get(target, prop, receiver)
            }

            // 2. Check all extensions for methods
            for (const extension of extensions) {
               if (prop in extension) {
                  const method = extension[prop as keyof typeof extension]
                  if (typeof method === "function") {
                     // Bind to super-delegate so it can see everything
                     return method.bind(receiver)
                  }
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

   /**
    * Get the accumulated type at the current stage.
    * This is a type-level operation only - no runtime implementation.
    */
   getAccumulatedType(): TAccumulated {
      throw new Error("Type-level method - do not call at runtime")
   }
}

/**
 * Internal step in the middleware chain.
 */
interface MiddlewareStep<
   TBase extends object,
   TBlueprint extends TBase,
   TDelegate extends DelegateOf<TBase, TBlueprint>,
> {
   extensionDef: ExtensionDefinition<TBase, TBlueprint, TDelegate>
   handler: MiddlewareHandler<any, any>
}
