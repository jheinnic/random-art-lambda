import { DynamicModule, Module } from "@nestjs/common"
import { DynamicModuleBlueprint } from "./DynamicModuleBlueprint.js"
import { IDynamicModuleBuilder } from "../interface/IDynamicModuleBuilder.js"

@Module({})
export class SimpleDynamicModule {
   public static registerModule(
      director: (builder: IDynamicModuleBuilder) => void,
   ): DynamicModule {
      const moduleFactoryBuilder = new DynamicModuleBlueprint(this)
      director(moduleFactoryBuilder)
      return moduleFactoryBuilder.build()
   }
}
