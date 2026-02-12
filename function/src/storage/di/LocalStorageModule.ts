import { DynamicModule, Module } from "@nestjs/common"
import { LocalResultStore } from "../components/LocalResultStore.js"

export interface LocalStorageModuleConfig {
   /**
    * Custom injection token to export the ResultStore under.
    * Allows multiple independent storage instances in the same application.
    *
    * @example
    * const PAINT_RESULT_STORE = Symbol("PaintResultStore")
    * const CACHE_STORE = Symbol("CacheStore")
    */
   exportToken: symbol
}

/**
 * Local filesystem-only storage module.
 * Creates a ResultStore that writes to local paths only.
 */
@Module({})
export class LocalStorageModule {
   static forRoot(config: LocalStorageModuleConfig): DynamicModule {
      const providers = [
         {
            provide: config.exportToken,
            useClass: LocalResultStore,
         },
      ]

      return {
         module: LocalStorageModule,
         providers,
         exports: [config.exportToken],
      }
   }
}
