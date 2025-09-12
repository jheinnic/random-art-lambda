import { ChannelWrapper } from "../../channels/ChannelWrapper"
import { DynamicModule, InjectionToken, Module, Type } from "@nestjs/common"
import {
   ConduitModuleFactory,
   DefaultDirector,
   IConduitModuleBuilder,
   IConduitModuleFactory,
} from "../../modules/index.js"
import { IRegionMapRepository } from "../../plotting/index.js"
import { RandomArtTaskCall, RandomArtTaskReply } from "../message/index.js"
import { PaintingModuleTypes } from "./Types.js"
import { RandomArtTaskEngine } from "../components/RandomArtTaskEngine.js"

const factory: IConduitModuleFactory<
   [
      Type<any> | DynamicModule,
      Type<IRegionMapRepository> | InjectionToken,
      Type<any> | DynamicModule,
      (
         | Type<ChannelWrapper<RandomArtTaskCall>>
         | InjectionToken<ChannelWrapper<RandomArtTaskCall>>
      ),
      Type<any> | DynamicModule,
      (
         | Type<ChannelWrapper<RandomArtTaskReply>>
         | InjectionToken<ChannelWrapper<RandomArtTaskReply>>
      ),
   ],
   [],
   "forRoot",
   "forFeature"
> = new ConduitModuleFactory<
   [
      DynamicModule,
      InjectionToken,
      DynamicModule,
      InjectionToken<ChannelWrapper<RandomArtTaskCall>>,
      DynamicModule,
      InjectionToken<ChannelWrapper<RandomArtTaskReply>>,
   ],
   [],
   "root",
   "feature"
>({
   rootProto: [
      {} as unknown as DynamicModule,
      PaintingModuleTypes.InjectedRegionMapRepository as unknown as InjectionToken<IRegionMapRepository>,
      {} as unknown as DynamicModule,
      {} as unknown as InjectionToken<ChannelWrapper<RandomArtTaskCall>>,
      {} as unknown as DynamicModule,
      {} as unknown as InjectionToken<ChannelWrapper<RandomArtTaskReply>>,
   ],
})
const baseClass = factory
   .implementRootMethod(
      (
         repoModule: DynamicModule,
         repoToken: InjectionToken,
         callChanModule: DynamicModule,
         callChanToken: InjectionToken<ChannelWrapper<RandomArtTaskCall>>,
         replyChanModule: DynamicModule,
         replyChanToken: InjectionToken<ChannelWrapper<RandomArtTaskReply>>,
      ): DefaultDirector => {
         // TODO: Replace with actual DefaultDirector construction logic
         return (builder: IConduitModuleBuilder): void => {
            builder
               .importModules(repoModule, callChanModule, replyChanModule)
               .defineProviders(
                  {
                     provide: PaintingModuleTypes.InjectedRegionMapRepository,
                     useExisting: repoToken,
                  },
                  {
                     provide: PaintingModuleTypes.RandomArtTaskCallChannel,
                     useExisting: callChanToken,
                  },
                  {
                     provide: PaintingModuleTypes.RandomArtTaskReplyChannel,
                     useExisting: replyChanToken,
                  },
               )
         }
      },
   )
   .implementFeatureMethod((): DefaultDirector => {
      return (builder: IConduitModuleBuilder): void => {
         builder.exportProviders({
            provide: PaintingModuleTypes.IRandomArtTaskEngine,
            useClass: RandomArtTaskEngine,
         })
      }
   })
   .build()

@Module({
   imports: [PaintingModule.forFeature()],
})
export class PaintingModule extends baseClass {}
