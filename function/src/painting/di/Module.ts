import { DynamicModule, Module } from "@nestjs/common"
import {
   DefaultDirector,
   IDynamicModuleBuilder,
   InjectableModuleClassFactory,
} from "../../modules/index.js"
import { PaintingModuleTypes } from "./Types.js"
import { RandomArtTaskEngine } from "../components/RandomArtTaskEngine.js"

const injectModuleTokens = {
   regionMapRepo: PaintingModuleTypes.InjectedRegionMapRepository,
   taskCallChannel: PaintingModuleTypes.RandomArtTaskCallChannel,
   taskReplyChannel: PaintingModuleTypes.RandomArtTaskReplyChannel,
}

const moduleHost = InjectableModuleClassFactory.create(
   injectModuleTokens,
   (_config: object): DefaultDirector => {
      return (builder: IDynamicModuleBuilder): void => {
         builder.exportProviders({
            provide: PaintingModuleTypes.IRandomArtTaskEngine,
            useClass: RandomArtTaskEngine,
         })
      }
   },
)

export type PaintingModuleConfiguration = typeof moduleHost.externalConfig

@Module({})
export class PaintingModule extends moduleHost.build() {
   static forRoot(config: PaintingModuleConfiguration): DynamicModule {
      return super.forRoot(config)
   }
}
