import { ConfigurableModuleBuilder } from "@nestjs/common"

import { PlottingModuleConfiguration } from "./PlottingModuleConfiguration.js"
import { PlottingModuleTypes } from "./PlottingModuleTypes.js"

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } =
  new ConfigurableModuleBuilder<PlottingModuleConfiguration>({
    optionsInjectionToken: PlottingModuleTypes.PlottingModuleConfiguration, alwaysTransient: true
  }).build()
