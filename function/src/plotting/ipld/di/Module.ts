import { DynamicModule, Module } from "@nestjs/common"

import { IpldModule } from "../../../ipld/di/Module.js"
import { IpldPlottingModuleTypes } from "./Types.js"
import { schemaDsl, SerdesRepresentDomainTuples } from "./Options.js"

import { IpldRegionMapRepository } from "../components/IpldRegionMapRepository.js"
import { PlottingModuleTypes } from "../../di/Types.js"
import { ISerdesModuleBuilder } from "../../../ipld/index.js"
import {
   InjectableModuleClassFactory,
   IDynamicModuleDirector,
   IDynamicModuleBuilder,
} from "../../../modules/index.js"

const injectModuleTokens = {
   blockStore: IpldPlottingModuleTypes.InjectedBlockStore,
}

const moduleHost = InjectableModuleClassFactory.create(
   injectModuleTokens,
   (_config: object): IDynamicModuleDirector => {
      return (builder: IDynamicModuleBuilder): void => {
         builder.exportModules(
            IpldModule.register(
               schemaDsl,
               (
                  builder: ISerdesModuleBuilder<SerdesRepresentDomainTuples>,
               ): void => {
                  builder
                     .exportProduction(
                        "ModelEnvelope",
                        IpldPlottingModuleTypes.IModelEnvelopeSerdes,
                     )
                     .exportProduction(
                        "DataBlock",
                        IpldPlottingModuleTypes.IDataBlockSerdes,
                     )
               },
            ),
         )
         builder.exportProviders(
            {
               provide: IpldPlottingModuleTypes.IpldRegionMapRepository,
               useClass: IpldRegionMapRepository,
            },
            {
               provide: PlottingModuleTypes.IRegionMapRepository,
               useExisting: IpldPlottingModuleTypes.IpldRegionMapRepository,
            },
         )
      }
   },
)

export type IpldPlottingModuleConfiguration = typeof moduleHost.externalConfig

@Module({})
export class IpldPlottingModule extends moduleHost.build() {
   private static ROOT_MODULE: DynamicModule
   static forRoot(config: IpldPlottingModuleConfiguration): DynamicModule {
      if (IpldPlottingModule.ROOT_MODULE !== undefined) {
         throw new Error(
            "Cannot create the IPLD Plotting module multiple times...",
         )
      } else {
         console.log("Creating IPLD Plotting module the first time")
      }
      IpldPlottingModule.ROOT_MODULE = super.forRoot(config)
      return IpldPlottingModule.ROOT_MODULE
   }

   // static forSeedTypes<T extends object>(config: , TxFn>)
}
