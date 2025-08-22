import {
   Module,
   ConfigurableModuleBuilder,
   // ConfigurableModuleHost,
} from "@nestjs/common"

import { RandomArtTaskEngine } from "../components/RandomArtTaskEngine.js"

import { IRegionMapRepository } from "../../plotting/interface/index.js"
import { CoroutinesModule } from "../../coroutines/index.js"
import { PaintingModuleConfiguration } from "./Configuration.js"
import { PaintingModuleTypes } from "./Types.js"
import * as Providers from "./Providers.js"

// const dynamicHost: ConfigurableModuleHost<PaintingModuleConfiguration> =
const dynamicHost = new ConfigurableModuleBuilder<PaintingModuleConfiguration>({
   moduleName: "PaintingModule",
   optionsInjectionToken: PaintingModuleTypes.ModuleConfiguration,
   alwaysTransient: false,
}).build()

export type PaintingModuleAsyncOptions = typeof dynamicHost.ASYNC_OPTIONS_TYPE
export type PaintingModuleOptions = typeof dynamicHost.OPTIONS_TYPE

@Module({
   imports: [],
   providers: [
      RandomArtTaskEngine,
      Providers.unpackConfiguredRegionMapRepository,
      Providers.unpackConfiguredCallChannel,
      Providers.unpackConfiguredReplyChannel,
   ],
   exports: [RandomArtTaskEngine],
})
export class PaintingModule extends dynamicHost.ConfigurableModuleClass {}
