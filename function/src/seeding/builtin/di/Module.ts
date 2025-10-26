import { Module } from "@nestjs/common"
import { SeedingModule } from "../../di/Module.js"
import { SeedingModuleTypes } from "../../di/Types.js"
import { BuiltInSeedModuleTypes } from "./Types.js"
import { ModuleActivator } from "../components/ModuleActivator.js"

@Module({
   imports: [SeedingModule],
   providers: [
      {
         provide: BuiltInSeedModuleTypes.ModuleActivator,
         useClass: ModuleActivator,
      },
      {
         provide: BuiltInSeedModuleTypes.GenModelSeedExtensionRegistry,
         useExisting: SeedingModuleTypes.GenModelSeedExtensionRegistry,
      },
   ],
})
export class BuiltInGenModelSeedingModule {}
