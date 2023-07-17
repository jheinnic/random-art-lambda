import { DynamicModule, Module } from "@nestjs/common"

import { IpfsModuleTypes } from "../../ipfs/di/IpfsModuleTypes.js"
import { IpldModuleTypes } from "./IpldModuleTypes.js"
import { ASYNC_OPTIONS_TYPE, ConfigurableModuleClass, OPTIONS_TYPE } from "./IpldModuleDefinition.js"

import { IpldSchemaParser, parseSchemaDsl } from "../components/IpldSchemaParser.js"
import { IpldSerdesFactory, curryRootProduction } from "../components/IpldSerdesFactory.js"


@Module( {
  providers: [
    {
      provide: IpldModuleTypes.SerdesFactory,
      useFactory: parseSchemaDsl,
      inject: [ IpldModuleTypes.SchemaParser, IpldModuleTypes.SchemaDslConfig ]
    },
    { provide: IpldModuleTypes.SchemaParser, useClass: IpldSchemaParser }
  ],
  exports: [ IpldModuleTypes.SerdesFactory ]
} )
export class IpldModule extends ConfigurableModuleClass {
  // static module = initializer(IpfsModule)

  static register( config: typeof OPTIONS_TYPE ): DynamicModule {
    return super.register( config )
  }

  static registerAsync( options: typeof ASYNC_OPTIONS_TYPE ): DynamicModule {
    return super.registerAsync( options )
  }
}
