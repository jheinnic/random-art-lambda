import { DynamicModule } from "@nestjs/common"

import { ExtensionPointModule } from "../../extensions/di/Module.js"
import { SeedingModuleTypes } from "./Types.js"

export const DynamicWranglerModule: DynamicModule =
   ExtensionPointModule.doRegisterModule({
      wranglerProviderToken: SeedingModuleTypes.GMSeedExtensionWrangler,
   })
