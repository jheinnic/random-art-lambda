import { ConfigurableModuleBuilder, Module } from "@nestjs/common"

// import { PlottingModuleTypes } from "../../di/PlottingModuleTypes.js"
import { ProtobufPlottingModuleTypes } from "./Types.js"
import { PBufSourceConfiguration } from "../components/PBufSourceConfiguration.js"
import { PBufRegionMapFactory } from "../components/PBufRegionMapFactory.js"
import { PBufRegionMapRepository } from "../components/PBufRegionMapRepository.js"
import { ProtobufPlottingModuleConfiguration } from "./Configuration.js"
import * as Providers from "./Providers.js"

const dynamicHost =
   new ConfigurableModuleBuilder<ProtobufPlottingModuleConfiguration>({
      moduleName: "ProtobufPlottingModule",
      optionsInjectionToken: ProtobufPlottingModuleTypes.ModuleConfiguration,
      alwaysTransient: false,
   }).build()

export type ProtobufPlottingModuleAsyncOptions =
   typeof dynamicHost.ASYNC_OPTIONS_TYPE
export type ProtobufPlottingModuleOptions = typeof dynamicHost.OPTIONS_TYPE

@Module({
   imports: [],
   providers: [
      PBufRegionMapFactory,
      PBufSourceConfiguration,
      PBufRegionMapRepository,
      Providers.regionMapRepositoryAlias,
      Providers.unpackConfiguredCallChannel,
      Providers.unpackConfiguredReplyChannel,
   ],
   exports: [PBufRegionMapRepository, Providers.regionMapRepositoryAlias],
})
export class ProtobufPlottingModule extends dynamicHost.ConfigurableModuleClass {}
