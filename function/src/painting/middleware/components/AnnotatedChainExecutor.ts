import { Injectable, Logger, Type } from "@nestjs/common"
import { ModuleRef } from "@nestjs/core"
import "reflect-metadata"

import {
   MiddlewareRegistry,
   MIDDLEWARE_CONTEXT_FIELD_KEY,
   type ContextFieldMetadata,
   type MiddlewareStepMetadata,
   getStepMetadata,
} from "../annotations/MiddlewareAnnotations.js"

/**
 * Interface that all middleware steps must implement
 */
export interface IMiddlewareStep<
   TRequires extends object = object,
   TProvides extends object = object,
> {
   /**
    * Execute the step, receiving the current context and returning
    * the new context fields this step provides.
    */
   execute(context: TRequires): Promise<TProvides>
}

/**
 * Configuration for the chain executor
 */
export interface ChainExecutorConfig {
   /** Log each step execution */
   verbose?: boolean

   /** Stop execution on first error vs collect all */
   failFast?: boolean
}

/**
 * Executes a middleware chain by:
 * 1. Discovering all @MiddlewareStep-decorated classes
 * 2. Ordering them by dependency graph
 * 3. Instantiating each via NestJS DI
 * 4. Injecting @FromContext fields from the accumulating context
 * 5. Executing in order, merging results into context
 */
@Injectable()
export class AnnotatedChainExecutor {
   private readonly logger = new Logger("AnnotatedChainExecutor")

   constructor(private readonly moduleRef: ModuleRef) {}

   /**
    * Execute the middleware chain with an initial context.
    *
    * @param initialContext - The starting context (e.g., from request)
    * @param stepClasses - Optional subset of steps to run (defaults to all registered)
    * @param config - Execution configuration
    * @returns The final accumulated context after all steps
    */
   async execute<TInitial extends object, TFinal extends object>(
      initialContext: TInitial,
      stepClasses?: Type<IMiddlewareStep>[],
      config: ChainExecutorConfig = {},
   ): Promise<TFinal> {
      const { verbose = false, failFast = true } = config

      // Get ordered steps (either provided or from registry)
      const orderedSteps = stepClasses || MiddlewareRegistry.getOrderedSteps()

      // Accumulate context through the chain
      let context: Record<string, unknown> = { ...initialContext } as Record<string, unknown>

      for (const StepClass of orderedSteps) {
         const metadata = getStepMetadata(StepClass)
         if (!metadata) {
            this.logger.warn(`Step ${StepClass.name} has no metadata, skipping`)
            continue
         }

         if (verbose) {
            this.logger.log(
               `Executing step: ${metadata.name} (requires: ${metadata.requires.join(", ") || "none"}, provides: ${metadata.provides.join(", ")})`,
            )
         }

         try {
            // Get or create the step instance via NestJS DI
            const stepInstance = await this.moduleRef.resolve(
               StepClass as Type<IMiddlewareStep>,
               undefined,
               { strict: false },
            )

            // Inject @FromContext fields
            this.injectContextFields(stepInstance, context, metadata)

            // Execute the step
            const result = await stepInstance.execute(context)

            // Merge result into context
            if (result && typeof result === "object") {
               context = { ...context, ...result }
            }

            if (verbose) {
               this.logger.log(
                  `Step ${metadata.name} completed, context now has: ${Object.keys(context).join(", ")}`,
               )
            }
         } catch (error) {
            this.logger.error(`Step ${metadata.name} failed:`, error)
            if (failFast) {
               throw error
            }
         }
      }

      return context as TFinal
   }

   /**
    * Inject values from the context into @FromContext-decorated fields
    */
   private injectContextFields(
      instance: object,
      context: Record<string, unknown>,
      metadata: MiddlewareStepMetadata,
   ): void {
      for (const [propertyKey, fieldMeta] of metadata.contextFields) {
         const value = context[fieldMeta.contextSource]

         if (value === undefined) {
            throw new Error(
               `Context field "${fieldMeta.contextSource}" required by ${metadata.name}.${propertyKey} is not present`,
            )
         }

         // Type check at runtime (optional but helpful for debugging)
         if (
            fieldMeta.expectedType &&
            fieldMeta.expectedType !== Object &&
            !(value instanceof fieldMeta.expectedType) &&
            typeof value !== fieldMeta.expectedType.name.toLowerCase()
         ) {
            this.logger.warn(
               `Type mismatch for ${metadata.name}.${propertyKey}: expected ${fieldMeta.expectedType.name}, got ${typeof value}`,
            )
         }

         // Inject the value
         ;(instance as Record<string, unknown>)[propertyKey] = value
      }
   }

   /**
    * Validate that a chain can be executed with a given initial context.
    * Useful for startup validation.
    */
   validateChain(
      initialProvides: string[],
      stepClasses?: Type<IMiddlewareStep>[],
   ): { valid: boolean; errors: string[] } {
      const errors: string[] = []
      const provided = new Set(initialProvides)

      const steps = stepClasses || MiddlewareRegistry.getOrderedSteps()

      for (const StepClass of steps) {
         const metadata = getStepMetadata(StepClass)
         if (!metadata) {
            errors.push(`Step ${StepClass.name} has no metadata`)
            continue
         }

         // Check all requirements are satisfied
         for (const req of metadata.requires) {
            if (!provided.has(req)) {
               errors.push(
                  `Step ${metadata.name} requires "${req}" but it's not provided by previous steps`,
               )
            }
         }

         // Add this step's provides
         metadata.provides.forEach((p) => provided.add(p))
      }

      return {
         valid: errors.length === 0,
         errors,
      }
   }
}
