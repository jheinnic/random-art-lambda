import { DynamicModule, Module, OnModuleInit, Logger, Type } from "@nestjs/common"
import { ActivityUnitExecutor } from "./ActivityUnitExecutor.js"
import { GatheringWorkerBridge, type GatheringBridgeConfig } from "./GatheringWorkerBridge.js"
import { ActivityUnitRegistry, type IActivityUnit } from "./ActivityUnitAnnotations.js"

/**
 * Configuration for the activity module
 */
export interface ActivityModuleOptions {
   /**
    * Activity unit classes to register.
    * Classes decorated with @ActivityUnit are auto-discovered,
    * but you can add more here if needed.
    */
   activityUnits?: Type<IActivityUnit<unknown, unknown>>[]

   /**
    * Validate the activity chain at startup
    */
   validateOnInit?: boolean

   /**
    * Initial context fields that will always be provided
    * (for validation purposes)
    */
   initialProvides?: string[]

   /**
    * Configuration for the GatheringWorkerBridge
    */
   bridgeConfig?: GatheringBridgeConfig
}

/**
 * Module providing activity unit execution infrastructure.
 *
 * This module provides:
 * - ActivityUnitExecutor: Runs ordered activity pipelines
 * - GatheringWorkerBridge: Connects GatheringWorker to activity pipeline
 *
 * @example
 * // In your app module:
 * @Module({
 *   imports: [
 *     ActivityModule.forRoot({
 *       activityUnits: [
 *         ImageFileStagingActivity,
 *         HttpImageUploadActivity,
 *       ],
 *       validateOnInit: true,
 *       initialProvides: ["imageBuffer", "taskId", "pathName"],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * // In a service (typically GatheringWorker):
 * @Injectable()
 * export class RandomArtGatheringWorker {
 *   constructor(
 *     private readonly bridge: GatheringWorkerBridge,
 *   ) {}
 *
 *   async handleGatherRequest(envelope: Envelope<GatherRequest>) {
 *     return envelope.handleWith(async (env) => {
 *       // ... assemble the image ...
 *       const imageBuffer = await this.assembleImage(paintedParts)
 *
 *       // Hand off to the bridge - GatheringWorker doesn't care what happens next
 *       return this.bridge.processAssembledImage({
 *         imageBuffer,
 *         context,
 *         taskId: request.taskId,
 *         correlationId: env.correlationId,
 *         timing: { paintingMs, assemblyMs },
 *       })
 *     })
 *   }
 * }
 */
@Module({})
export class ActivityModule implements OnModuleInit {
   private static options: ActivityModuleOptions = {}
   private readonly logger = new Logger("ActivityModule")

   static forRoot(options: ActivityModuleOptions = {}): DynamicModule {
      this.options = options

      // Collect all activity unit classes for DI registration
      const activityProviders: Type<IActivityUnit<unknown, unknown>>[] = [
         ...(options.activityUnits ?? []),
      ]

      return {
         module: ActivityModule,
         providers: [
            ActivityUnitExecutor,
            GatheringWorkerBridge,
            ...activityProviders,
         ],
         exports: [
            ActivityUnitExecutor,
            GatheringWorkerBridge,
            ...activityProviders,
         ],
         global: true,
      }
   }

   onModuleInit(): void {
      const options = ActivityModule.options

      // Log discovered activity units
      const allUnits = ActivityUnitRegistry.getAllUnits()
      this.logger.log(`Discovered ${allUnits.length} activity units:`)
      for (const [constructor, metadata] of allUnits) {
         this.logger.log(
            `  - ${metadata.name} (priority: ${metadata.priority ?? 100}): ` +
               `requires [${metadata.requires?.join(", ") ?? "none"}] → ` +
               `provides [${metadata.provides?.join(", ") ?? "none"}]`,
         )
      }

      // Log execution order
      const orderedUnits = ActivityUnitRegistry.getOrderedUnits()
      if (orderedUnits.length > 0) {
         const order = orderedUnits
            .map((cls) => {
               const meta = ActivityUnitRegistry.getAllUnits().find(
                  ([c]) => c === cls,
               )
               return meta ? meta[1].name : cls.name
            })
            .join(" → ")
         this.logger.log(`Execution order: ${order}`)
      }

      // Validate chain if requested
      if (options.validateOnInit && options.initialProvides) {
         const provided = new Set(options.initialProvides)
         const errors: string[] = []

         for (const UnitClass of orderedUnits) {
            const entry = ActivityUnitRegistry.getAllUnits().find(
               ([c]) => c === UnitClass,
            )
            if (!entry) continue
            const [, metadata] = entry

            // Check requirements
            for (const req of metadata.requires ?? []) {
               if (!provided.has(req)) {
                  errors.push(
                     `Activity "${metadata.name}" requires "${req}" but it's not provided`,
                  )
               }
            }

            // Add provides
            for (const p of metadata.provides ?? []) {
               provided.add(p)
            }
         }

         if (errors.length > 0) {
            this.logger.error("Activity chain validation failed:")
            for (const err of errors) {
               this.logger.error(`  - ${err}`)
            }
            throw new Error(
               `Activity chain validation failed: ${errors.join("; ")}`,
            )
         }

         this.logger.log("Activity chain validation passed")
      }
   }
}
