import { DynamicModule, Module } from "@nestjs/common"
import { DynamicModuleBuilder } from "./ConduitModuleBuilder.js"
import { IConduitModuleBuilder } from "../interface/IConduitModuleBuilder.js"

@Module({})
export class SimpleDynamicModule {
   public static registerModule(
      director: (builder: IConduitModuleBuilder) => void,
   ): DynamicModule {
      const moduleFactoryBuilder = new DynamicModuleBuilder(this)
      director(moduleFactoryBuilder)
      return moduleFactoryBuilder.build()
   }
}
