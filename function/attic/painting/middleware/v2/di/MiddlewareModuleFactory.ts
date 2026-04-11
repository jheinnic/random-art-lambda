import { Provider, Logger, InjectionToken, Type } from "@nestjs/common"
import { InjectableModuleClassFactory } from "../../../modules/di/InjectableModuleClassFactory.js"
import { IDynamicModuleBuilder } from "../../../modules/interface/IDynamicModuleBuilder.js"
import { MiddlewareDependencyTokens } from "./MiddlewareDependencyTokens.js"
import { MiddlewarePropsFor } from "./MiddlewarePropsFor.js"
import { MiddlewareConfig } from "./MiddlewareConfig.js"
import { MiddlewareProps } from "./MiddlewareProps.js"
import { MiddlewareHandler } from "../types/MiddlewareHandler.js"
import { RandomArtPaintingTypes } from "../../types/RandomArtPaintingTypes.js"

/**
 * Standard dependency tokens for middleware module
 */
export const MiddlewareDependencies = {
   S3FileStore: Symbol("FileStore<S3>"),
   LocalFileStore: Symbol("FileStore<Local>"),
   ExpressionAddons: Symbol("ExpressionContextAddons"),
   BufferCache: Symbol("BufferCache"),
} as const satisfies MiddlewareDependencyTokens

/**
 * Create providers for a middleware chain
 *
 * For each middleware in the chain:
 * 1. Auto-generates internal tokens (params, logger, middleware instance)
 * 2. Creates provider for value parameters
 * 3. Creates provider for logger instance
 * 4. Creates factory provider for middleware instance
 *
 * @param chain Array of middleware configuration objects
 * @returns Object containing providers array and middleware tokens for chain executor
 */
function createMiddlewareProviders<
   MWares extends Array<MiddlewareHandler<any, any>>,
>(
   chain: MiddlewarePropsFor<MWares>,
): {
   providers: Provider[]
   middlewareTokens: Array<symbol | string>
} {
   const providers: Provider[] = []
   const middlewareTokens: Array<symbol | string> = []

   chain.forEach(
      (props: MiddlewareProps<Type<MWares[typeof index]>>, index: number) => {
         const className: string = props.middlewareClass.name

         // Auto-generate internal tokens
         const paramsToken = Symbol(`${className}_${index}_params`)
         const loggerToken = Symbol(`${className}_${index}_logger`)
         const middlewareToken = Symbol(`${className}_${index}`)

         middlewareTokens.push(middlewareToken)

         // Create params provider
         providers.push({
            provide: paramsToken,
            useValue: props.valueParams,
         })

         // Create logger provider
         providers.push({
            provide: loggerToken,
            useFactory: () => new Logger(className),
            inject: [],
         })

         // Build inject array: [params, logger, ...dependencies]
         const injectTokens: Array<InjectionToken<any>> = [
            paramsToken,
            loggerToken,
         ]
         if (props.inject !== undefined && props.inject.length > 0) {
            injectTokens.push(...props.inject)
         }

         // Create middleware provider
         providers.push({
            provide: middlewareToken,
            useFactory: (
               ...args: ConstructorParameters<Type<MWares[typeof index]>>
            ): MWares[typeof index] => {
               // eslint-disable-next-line new-cap
               return new props.middlewareClass(...args)
            },
            inject: injectTokens,
         })
      },
   )

   return { providers, middlewareTokens }
}

/**
 * Create a factory provider for a middleware chain executor
 *
 * @param providerToken Token for the chain executor
 * @param middlewareTokens Auto-generated tokens for middleware instances
 * @param executorClass Class to instantiate (ItemMiddlewareChain or CollectionMiddlewareChain)
 * @returns NestJS factory provider
 */
function createChainExecutorProvider(
   providerToken: symbol | string,
   middlewareTokens: Array<symbol | string>,
   executorClass: new (handlers: MiddlewareHandler[]) => any,
): Provider {
   return {
      provide: providerToken,
      useFactory: (...middlewares: MiddlewareHandler[]) => {
         // eslint-disable-next-line new-cap
         return new executorClass(middlewares)
      },
      inject: middlewareTokens,
   }
}

/**
 * Factory function for creating middleware module
 *
 * Uses InjectableModuleClassFactory to wire up:
 * - Individual middleware handlers with their dependencies
 * - Item-level middleware chain executor
 * - Collection-level middleware chain executor
 * - Shared infrastructure (LRU cache, expression evaluator)
 */
export const MiddlewareModuleFactory = InjectableModuleClassFactory.create<
   MiddlewareConfig,
   typeof MiddlewareDependencies
>(
   MiddlewareDependencies,
   (config: MiddlewareConfig) =>
      (builder: IDynamicModuleBuilder): void => {
         // Create providers for all middleware handlers in item chain
         const itemChainResult = createMiddlewareProviders(config.itemChain)
         builder.defineProviders(...itemChainResult.providers)

         // Create providers for all middleware handlers in collection chain
         // const collectionChainResult = createMiddlewareProviders(
         //    config.collectionChain,
         // )
         // builder.defineProviders(...collectionChainResult.providers)

         // Create item middleware chain executor
         // TODO: Import ItemMiddlewareChainExecutor class
         const itemChainProvider = createChainExecutorProvider(
            RandomArtPaintingTypes.ItemMiddlewareChain,
            itemChainResult.middlewareTokens,
            class ItemMiddlewareChainExecutor {
               constructor(public readonly middlewares: any[]) {}
               async execute(ctx: any): Promise<any> {
                  let current = ctx
                  for (const middleware of this.middlewares) {
                     current = await middleware.handle(current)
                     if (current.disposition !== "OK") break
                  }
                  return current
               }
            },
         )
         builder.defineProviders(itemChainProvider)

         // Create collection middleware chain executor
         // TODO: Import CollectionMiddlewareChainExecutor class
         // const collectionChainProvider = createChainExecutorProvider(
         //    RandomArtPaintingTypes.CollectionMiddlewareChain,
         //    collectionChainResult.middlewareTokens,
         //    class CollectionMiddlewareChainExecutor {
         //       constructor(public readonly middlewares: any[]) {}
         //       async execute(ctx: any): Promise<any> {
         //          let current = ctx
         //          for (const middleware of this.middlewares) {
         //             current = await middleware.handle(current)
         //             if (current.disposition !== "OK") break
         //          }
         //          return current
         //       }
         //    },
         // )
         // builder.defineProviders(collectionChainProvider)

         // Export the chain executors for use by workers
         builder.exportProviders(itemChainProvider) // , collectionChainProvider)

         // TODO: Add LRU cache provider
         // TODO: Add expression evaluator provider with custom functions
      },
)
