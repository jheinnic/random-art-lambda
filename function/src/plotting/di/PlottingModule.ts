import { DynamicModule, Module } from "@nestjs/common"
import { Blockstore } from "interface-blockstore"

import { IpfsModule, IpfsModuleTypes } from "../../ipfs/di/index.js"
import { IpldRegionMapRepository } from "../components/IpldRegionMapRepository.js"
import { IpldRegionMapSchemaDsl } from "../components/IpldRegionMapSchemaDsl.js"
import { PBufAdapterFactory } from "../protobuf/PBufAdapterFactory.js"
import { PlottingModuleAsyncOptions } from "./PlottingModuleAsyncOptions.js"
import { PlottingModuleConfiguration } from "./PlottingModuleConfiguration.js"
import { ConfigurableModuleClass } from "./PlottingModuleDefinition.js"
import { PlottingModuleTypes } from "./PlottingModuleTypes.js"

@Module( {
  providers: [
    {
      provide: PlottingModuleTypes.IRegionMapRepository,
      useClass: IpldRegionMapRepository
    },
    {
      provide: PlottingModuleTypes.IRegionMapSchemaSerdes,
      useClass: IpldRegionMapSchemaDsl
    },
    {
      provide: PlottingModuleTypes.ProtoBufAdapterFactory,
      useClass: PBufAdapterFactory
    },
    {
      provide: PlottingModuleTypes.InjectedBlockStore,
      useFactory: ( config: PlottingModuleConfiguration ): Blockstore => {
        return config.blockStore
      },
      inject: [ PlottingModuleTypes.PlottingModuleConfiguration ]
    }
  ],
  exports: [ PlottingModuleTypes.IRegionMapRepository, PlottingModuleTypes.ProtoBufAdapterFactory ]
} )
// eslint-disable-next-line @typescript-eslint/no-extraneous-class, @typescript-eslint/no-unused-vars
export class PlottingModule extends ConfigurableModuleClass {
  registerAsync( options: PlottingModuleAsyncOptions ): DynamicModule {
    return super.registerAsync( options )
  }
}
