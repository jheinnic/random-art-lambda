import { ExtensionPointModule } from "../../extensions/di/Module.js"
import { SeedingModuleTypes } from "./Types.js"

export const wranglerSupportDynamicModule =
   ExtensionPointModule.doRegisterModule({
      wranglerProviderToken:
         SeedingModuleTypes.GenModelSeedExtensionPointWrangler,
   })
