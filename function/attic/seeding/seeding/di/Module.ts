import { Module } from "@nestjs/common"
import { SeedingModuleTypes } from "./Types.js"
import { DynamicWranglerModule } from "./ChildModule.js"
import { GenModelSeedAdapterFactory } from "../components/GenModelSeedAdapterFactory.js"
import { GenModelSeedExtensionPoint } from "../components/GenModelSeedExtensionPoint.js"

@Module({
   imports: [DynamicWranglerModule],
   providers: [
      {
         provide: SeedingModuleTypes.GMSeedExtensionMatchmaker,
         useExisting: SeedingModuleTypes.GMSeedExtensionWrangler,
      },
      {
         provide: SeedingModuleTypes.GMSeedExtensionRegistry,
         useExisting: SeedingModuleTypes.GMSeedExtensionWrangler,
      },
      {
         provide: SeedingModuleTypes.GMSeedAdapterFactory,
         useClass: GenModelSeedAdapterFactory,
      },
      {
         provide: SeedingModuleTypes.GMSeedExtensionPoint,
         useClass: GenModelSeedExtensionPoint,
      },
   ],
   exports: [
      SeedingModuleTypes.GMSeedExtensionRegistry,
      SeedingModuleTypes.GMSeedExtensionPoint,
   ],
})
export class SeedingModule {}
