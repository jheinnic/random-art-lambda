import { DynamicModule } from "@nestjs/common"
import { IBaseDynamicModuleBuilder } from "./IDynamicModuleBuilder.js"

export interface IDynamicModuleBlueprint
   extends IBaseDynamicModuleBuilder<IDynamicModuleBlueprint> {
   build: () => DynamicModule
}
