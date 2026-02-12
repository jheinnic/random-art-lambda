import { DynamicModule, Module, OnModuleInit, Logger, Type } from "@nestjs/common"
import { AnnotatedChainExecutor, type IMiddlewareStep } from "./components/AnnotatedChainExecutor.js"
import { MiddlewareRegistry } from "./annotations/MiddlewareAnnotations.js"

/**
 * Configuration for the middleware module
 */
export interface MiddlewareModuleOptions {
   /**
    * Additional step classes to register.
    * Steps decorated with @MiddlewareStep are auto-discovered,
    * but you can add more here if needed.
    */
   additionalSteps?: Type<IMiddlewareStep>[]

   /**
    * Validate the chain at startup
    */
   validateOnInit?: boolean

   /**
    * Initial context fields that will always be provided
    * (for validation purposes)
    */
   initialProvides?: string[]
}

/**
 * Module providing middleware chain execution infrastructure.
 *
 * @example
 * // In your app module:
 * @Module({
 *   imports: [
 *     MiddlewareModule.forRoot({
 *       validateOnInit: true,
 *       initialProvides: ["taskId", "imageData", "genSeed"],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * // In a service:
 * @Injectable()
 * export class GatheringService {
 *   constructor(
 *     private readonly chainExecutor: AnnotatedChainExecutor,
 *   ) {}
 *
 *   async processGatheredTask(request: GatherRequest) {
 *     const initialContext = {
 *       taskId: request.taskId,
 *       imageData: request.imageData,
 *       genSeed: request.paintTask.genSeed,
 *     }
 *
 *     // The chain auto-discovers steps, orders by dependencies, and executes
 *     const finalContext = await this.chainExecutor.execute(initialContext)
 *
 *     // finalContext now has everything all steps provided
 *     return finalContext.stagedResult
 *   }
 * }
 */
@Module({})
export class MiddlewareModule implements OnModuleInit {
   private static options: MiddlewareModuleOptions = {}
   private readonly logger = new Logger("MiddlewareModule")

   static forRoot(options: MiddlewareModuleOptions = {}): DynamicModule {
      this.options = options

      // Collect all step classes for DI registration
      const stepProviders: Type<IMiddlewareStep>[] = [
         // Steps are provided by the application developer via additionalSteps
         // Built-in steps will be added as the framework matures
         ...(options.additionalSteps || []),
      ]

      return {
         module: MiddlewareModule,
         providers: [
            AnnotatedChainExecutor,
            ...stepProviders,
         ],
         exports: [
            AnnotatedChainExecutor,
            ...stepProviders,
         ],
         global: true,
      }
   }

   onModuleInit(): void {
      const options = MiddlewareModule.options

      // Log discovered steps
      const allSteps = MiddlewareRegistry.getAllSteps()
      this.logger.log(`Discovered ${allSteps.length} middleware steps:`)
      for (const [constructor, metadata] of allSteps) {
         this.logger.log(
            `  - ${metadata.name}: requires [${metadata.requires.join(", ")}] → provides [${metadata.provides.join(", ")}]`,
         )
      }

      // Validate chain if requested
      if (options.validateOnInit && options.initialProvides) {
         try {
            const orderedSteps = MiddlewareRegistry.getOrderedSteps()
            this.logger.log(
               `Chain execution order: ${orderedSteps.map((s) => s.name).join(" → ")}`,
            )

            // Validate with AnnotatedChainExecutor would require instance
            // For now, just validate ordering works
         } catch (error) {
            this.logger.error("Middleware chain validation failed:", error)
            throw error
         }
      }
   }
}
