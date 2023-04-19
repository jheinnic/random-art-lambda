import { ConfigurableModuleBuilder, Module } from "@nestjs/common"

import { SharedBlockstoresModule } from "./app/di/SharedBlockstoresModule.js"
import { CompModule } from "./ToyCompModule01.js"
import { AppService, ArtBlocks, GCHashFactory, PseudoRepo, TaskBlocks } from "./ToyComps01.js"

export class ToyModuleConfiguration {
    constructor (
        public readonly artBlocks: Blockstore,
        public readonly taskBlocks: Blockstore 
     ) { }
}

export const ToyModuleConfig: unique symbol = Symbol("ToyConfig")

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } =
  new ConfigurableModuleBuilder<ToyModuleConfiguration>({
    optionsInjectionToken: ToyModuleConfig, alwaysTransient: true
  }).build()


@Module({
    providers: [
      GCHashFactory, AppService, PseudoRepo,
      {provide: TaskBlocks, useFactory: (config: ToyModuleConfiguration) => config.taskBlocks, inject: [ToyConfig] },
      {provide: ArtBlocks, useFactory: (config: ToyModuleConfiguration) => config.artBlocks, inject: [ToyConfig] },
    ],
    exports: [
      GCHashFactory, AppService, PseudoRepo
    ]
  })
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class CompModule extends ConfigurableModuleClass {

}