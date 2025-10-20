import { DynamicModule, Module } from "@nestjs/common"
import {
   DefaultDirector,
   IDynamicModuleBuilder,
   InjectableModuleClassFactory,
} from "../../modules/index.js"
import { PaintingModuleTypes } from "./Types.js"
import { RandomArtTaskEngine } from "../components/RandomArtTaskEngine.js"
import { DynamicModuleBlueprint } from './../../modules/di/DynamicModuleBlueprint';
import { GenModelFactory } from "../components/GenModelFactory.js";

const injectModuleTokens = {
   regionMapRepo: PaintingModuleTypes.InjectedRegionMapRepository,
   taskCallChannel: PaintingModuleTypes.RandomArtTaskCallChannel,
   taskReplyChannel: PaintingModuleTypes.RandomArtTaskReplyChannel,
}

const moduleHost = InjectableModuleClassFactory.create(
   injectModuleTokens,
   (_config: object): DefaultDirector => {
      return (builder: IDynamicModuleBuilder): void => {
         builder.exportProviders({
            provide: PaintingModuleTypes.IRandomArtTaskEngine,
            useClass: RandomArtTaskEngine,
         }, {
            provide: PaintingModuleTypes.IGenModelSeedRegistry,
            useClass: GenModelFactory
         }, {
            provide: PaintingModuleTypes.IGenModelFactory,
            useExisting: PaintingModuleTypes.IGenModelSeedRegistry
         })
      }
   },
)

export type PaintingModuleConfiguration = typeof moduleHost.externalConfig

@Module({})
export class PaintingModule extends moduleHost.build() {
   private static ROOT_MODULE: DynamicModule
   static forRoot(config: PaintingModuleConfiguration): DynamicModule {
      if (PaintingModule.ROOT_MODULE !== undefined) {
         throw new Error("Cannot create the root painting module multiple times...")
      }
      PaintingModule.ROOT_MODULE = super.forRoot(config)
      return PaintingModule.ROOT_MODULE
   }

   // static forSeedTypes<T extends object>(config: , TxFn>)
}


export function packageSeedingModule<T>(txs: { [K in keyof T]: TxFn<T[K]> }) {
   const builder = new DynamicModuleBlueprint(PaintingModule)
   let tk
   for (tk in Object.keys(txs)) {
      builder.exportProviders(
         Object.entries(txs).map((x) => {
            return {
               provide: x[0],
               useFactory: (x: ),
               inject: 
            }
         }))
      )
   }
}
   
}
