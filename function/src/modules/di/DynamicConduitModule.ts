import { DynamicModule, Module } from "@nestjs/common"
import { ConduitModuleBuilder } from "./ConduitModuleBuilder.js"
import { IConduitModuleBuilder } from "../interface/IConduitModuleBuilder.js"

@Module({})
export class DynamicConduitModule {
   public static registerModule(
      director: (builder: IConduitModuleBuilder) => void,
   ): DynamicModule {
      const moduleFactoryBuilder = new ConduitModuleBuilder(this)
      director(moduleFactoryBuilder)
      return moduleFactoryBuilder.build()
   }
}
