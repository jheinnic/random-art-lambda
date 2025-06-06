import { ConfigurableModuleBuilder } from "@nestjs/common";
import { PlottingModuleTypes } from "./PlottingModuleTypes.js";
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } = new ConfigurableModuleBuilder({
    optionsInjectionToken: PlottingModuleTypes.PlottingModuleConfiguration, alwaysTransient: true
}).build();
//# sourceMappingURL=PlottingModuleDefinition.js.map