import { DynamicModule, Module } from "@nestjs/common"

import { IpldModuleTypes } from "./IpldModuleTypes.js"
import { ASYNC_OPTIONS_TYPE, ConfigurableModuleClass, OPTIONS_TYPE } from "./IpldModuleDefinition.js"

// import { IpldSchemaParser, parseSchemaDsl } from "../components/IpldSchemaParser.js"
// import { IpldSerdesFactory, curryRootProduction } from "../components/IpldSerdesFactory.js"


@Module( {
  providers: [ ],
  exports: [ ]
} )
export class IpldModule extends ConfigurableModuleClass {
  static register( config: typeof OPTIONS_TYPE ): DynamicModule {
    return super.register( config )
  }

  static registerAsync( options: typeof ASYNC_OPTIONS_TYPE ): DynamicModule {
    return super.registerAsync( options )
  }
}
