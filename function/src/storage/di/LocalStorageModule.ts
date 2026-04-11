import { DynamicModule, Module } from "@nestjs/common"
import { LocalFileStore } from "../components/LocalFileStore.js"

export interface LocalStorageModuleConfig {
   /**
    * Injection token to export the IFileStore under.
    */
   exportToken: symbol

   /**
    * Base directory for all file paths (defaults to process.cwd()).
    */
   baseDirectory?: string
}

@Module({})
export class LocalStorageModule {
   static forRoot(config: LocalStorageModuleConfig): DynamicModule {
      const providers = [
         {
            provide: config.exportToken,
            useFactory: () =>
               new LocalFileStore(config.baseDirectory),
         },
      ]

      return {
         module: LocalStorageModule,
         providers,
         exports: [config.exportToken],
      }
   }
}
