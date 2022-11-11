import { ConfigurableModuleAsyncOptions } from "@nestjs/common/module-utils/interfaces"

import { PlottingModuleConfiguration } from "./PlottingModuleConfiguration.js"

export type PlottingModuleAsyncOptions = ConfigurableModuleAsyncOptions<PlottingModuleConfiguration>
