import { DynamicModule, Module } from "@nestjs/common"

// import { ExtensionPointModuleTypes } from "./Types.js"
import { ExtensionPointSupportConfiguration } from "./Configuration.js"
import {
   IDynamicModuleBuilder,
   simpleDynamicModule,
} from "../../modules/index.js"
import { ExtensionWrangler } from "../components/ExtensionWrangler.js"

@Module({})
export class ExtensionPointModule extends simpleDynamicModule(
   "ExtensionPointModule",
) {
   public static doRegisterModule(
      moduleConfig: ExtensionPointSupportConfiguration,
   ): DynamicModule {
      return super.registerModule((builder: IDynamicModuleBuilder) => {
         builder.identifyAs(this).exportProviders({
            provide: moduleConfig.wranglerProviderToken,
            useClass: ExtensionWrangler,
         })
      })
   }
}
