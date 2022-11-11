import { ConfigurableModuleOptionsFactory } from "@nestjs/common/module-utils/interfaces"

import { PlottingModuleConfiguration } from "./PlottingModuleConfiguration.js"

const CREATE_METHOD: string = "create"

export type PlottingModuleConfigurationFactory = ConfigurableModuleOptionsFactory<PlottingModuleConfiguration, typeof CREATE_METHOD>
