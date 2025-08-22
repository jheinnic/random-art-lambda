import { ConfigurableModuleBuilder, Module } from "@nestjs/common"
import { Blockstore } from "interface-blockstore"

import { IpldModule } from "../../../ipld/di/Module.js"
import { IpldPlottingModuleTypes } from "./Types.js"
import { ipldModuleOptions } from "./Options.js"

import { IpldRegionMapRepository } from "../components/IpldRegionMapRepository.js"
import { IpldPlottingModuleConfiguration } from "./Configuration.js"
import { PlottingModuleTypes } from "../../di/Types.js"

const dynamicHost =
   new ConfigurableModuleBuilder<IpldPlottingModuleConfiguration>({
      moduleName: "IpldPlottingModule",
      optionsInjectionToken: IpldPlottingModuleTypes.ModuleConfiguration,
      alwaysTransient: false,
   }).build()

export type IpldPlottingModuleAsyncOptions =
   typeof dynamicHost.ASYNC_OPTIONS_TYPE
export type IpldPlottingModuleOptions = typeof dynamicHost.OPTIONS_TYPE
// export const IpldPlottingModuleConfigurationToken = dynamicHost.MODULE_OPTIONS_TOKEN

@Module({
   imports: [IpldModule.register(ipldModuleOptions)],
   providers: [
      {
         provide: IpldPlottingModuleTypes.IpldRegionMapRepository,
         useClass: IpldRegionMapRepository,
      },
      {
         provide: IpldPlottingModuleTypes.InjectedBlockStore,
         useFactory: (config: IpldPlottingModuleConfiguration): Blockstore => {
            return config.blockStore
         },
         inject: [IpldPlottingModuleTypes.ModuleConfiguration],
      },
      {
         provide: PlottingModuleTypes.IRegionMapRepository,
         useExisting: IpldPlottingModuleTypes.IpldRegionMapRepository,
      },
   ],
   exports: [
      IpldPlottingModuleTypes.IpldRegionMapRepository,
      PlottingModuleTypes.IRegionMapRepository,
   ],
})
export class IpldPlottingModule extends dynamicHost.ConfigurableModuleClass {}
