import { ConfigurableModuleAsyncOptions } from "@nestjs/common/module-utils/interfaces"

import { PaintingModuleConfiguration } from "./PaintingModuleConfiguration.js"

export type PaintingModuleAsyncOptions = ConfigurableModuleAsyncOptions<PaintingModuleConfiguration>
