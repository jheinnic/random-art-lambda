import { Module, ConfigurableModuleBuilder } from "@nestjs/common"

import { CliMainModuleConfiguration } from "./Configuration.js"
import { CliMainModuleTypes } from "./Types.js"
import { allProviders } from "./Providers.js"

// import { PlotCommand } from "../components/PlotCommand.js"
import { GenericService } from "../components/GenericService.js"

const dynamicHost = new ConfigurableModuleBuilder<CliMainModuleConfiguration>({
   moduleName: "CliMainModule",
   optionsInjectionToken: CliMainModuleTypes.ModuleConfiguration,
   alwaysTransient: false,
}).build()

export type CliMainModuleAsyncOptions = typeof dynamicHost.ASYNC_OPTIONS_TYPE
export type CliMainModuleOptions = typeof dynamicHost.OPTIONS_TYPE

console.log(allProviders)

@Module({
   imports: [],
   providers: [...allProviders, GenericService],
   exports: [GenericService],
})
export class CliMainModule extends dynamicHost.ConfigurableModuleClass {}
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
