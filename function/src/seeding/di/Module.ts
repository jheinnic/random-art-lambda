import { Module } from "@nestjs/common"
import { SeedingModuleTypes } from "./Types.js"
import { wranglerSupportDynamicModule } from "./ChildModule.js"
import { GenModelSeedAdapterFactory } from "../components/GenModelSeedAdapterFactory.js"
import { GenModelSeedExtensionPoint } from "../components/GenModelSeedExtensionPoint.js"

@Module({
   imports: [wranglerSupportDynamicModule],
   providers: [
      {
         provide: SeedingModuleTypes.GenModelSeedAdapterFactory,
         useClass: GenModelSeedAdapterFactory,
      },
      {
         provide: SeedingModuleTypes.GenModelSeedMatchmaker,
         useExisting: SeedingModuleTypes.GenModelSeedExtensionPointWrangler,
      },
      {
         provide: SeedingModuleTypes.GenModelSeedExtensionRegistry,
         useExisting: SeedingModuleTypes.GenModelSeedExtensionPointWrangler,
      },
      {
         provide: SeedingModuleTypes.GenModelSeedExtensionPoint,
         useClass: GenModelSeedExtensionPoint,
      },
   ],
   exports: [
      SeedingModuleTypes.GenModelSeedExtensionRegistry,
      SeedingModuleTypes.GenModelSeedExtensionPoint,
   ],
})
export class SeedingModule {}
