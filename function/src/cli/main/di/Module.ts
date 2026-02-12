import { DynamicModule, Module } from "@nestjs/common"

import { CliMainModuleTypes } from "./Types.js"
import {
   DefaultDirector,
   IDynamicModuleBuilder,
   InjectableModuleClassFactory,
} from "../../../modules/index.js"

import { GenericService } from "../components/GenericService.js"

const injectModuleTokens = {
   paintEngine: CliMainModuleTypes.RandomArtTaskEngine,
   // regionMapRepo: CliMainModuleTypes.RegionMapRepository,
   // taskCallChannel: CliMainModuleTypes.RandomArtTaskCallChannel,
   queueFlowProducer: CliMainModuleTypes.RandomArtQueueFlowProducer,
}

interface ModuleDataConfig {
   _i_can?: boolean
}

const moduleHost = InjectableModuleClassFactory.create(
   injectModuleTokens,
   (_config: ModuleDataConfig): DefaultDirector => {
      return (builder: IDynamicModuleBuilder): void => {
         builder.exportProviders(GenericService)
      }
   },
)

export type CliMainConfiguration = typeof moduleHost.externalConfig

@Module({})
export class CliMainModule extends moduleHost.build() {
   public static forRoot(config: CliMainConfiguration): DynamicModule {
      return super.forRoot(config)
   }
}
