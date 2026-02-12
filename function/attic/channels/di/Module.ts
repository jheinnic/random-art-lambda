import { Module } from "@nestjs/common"

import { ChannelsModuleTypes } from "./Types.js"
import {
   DefaultDirector,
   IDynamicModuleBuilder,
   InjectableModuleClassFactory,
} from "../../modules/index.js"

import { RxLocalChannelModuleConfigData } from "./Configuration.js"
import { RxLocalCallChannel } from "../components/index.js"
import { Subject } from "rxjs"

const injectionTokens = {
   channelConfig: ChannelsModuleTypes.RxLocalCallChannelConfig,
} as const

const host: InjectableModuleClassFactory<
   RxLocalChannelModuleConfigData,
   typeof injectionTokens
> = InjectableModuleClassFactory.create(
   injectionTokens,
   (config: RxLocalChannelModuleConfigData): DefaultDirector => {
      return (builder: IDynamicModuleBuilder): void => {
         builder.identifyAs(RxLocalCallChannel)
         builder.exportProviders({
            provide: config.providerToken,
            useClass: RxLocalCallChannel,
         })
         builder.exportProviders({
            provide: ChannelsModuleTypes.RepliesChannel,
            useValue: new Subject(),
         })
      }
   },
)

@Module({})
export class RxLocalChannelModule extends host.build() {}

export type RxLocalChannelModuleConfig = typeof host.externalConfig
