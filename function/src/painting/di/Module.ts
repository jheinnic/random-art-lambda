import { ChannelWrapper } from "../../channels/ChannelWrapper"
import { DynamicModule, InjectionToken, Module, Type } from "@nestjs/common"
import {
   ModuleClassBlueprint,
   DefaultDirector,
   IDynamicModuleBuilder,
   IModuleBaseClassBlueprint,
} from "../../modules/index.js"
import { IRegionMapRepository } from "../../plotting/index.js"
import { RandomArtTaskCall, RandomArtTaskReply } from "../message/index.js"
import { PaintingModuleTypes } from "./Types.js"
import { RandomArtTaskEngine } from "../components/RandomArtTaskEngine.js"

const factory: IModuleBaseClassBlueprint<
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
> = new ModuleClassBlueprint<
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
>()
const baseClass = factory
   .implementRootMethod(
      (
         repoModule: Type<any> | DynamicModule,
         repoToken: Type<any> | InjectionToken,
         callChanModule: Type<any> | DynamicModule,
         callChanToken:
            | Type<any>
            | InjectionToken<ChannelWrapper<RandomArtTaskCall>>,
         replyChanModule: Type<any> | DynamicModule,
         replyChanToken:
            | Type<any>
            | InjectionToken<ChannelWrapper<RandomArtTaskReply>>,
      ): DefaultDirector => {
         // TODO: Replace with actual DefaultDirector construction logic
         return (builder: IDynamicModuleBuilder): void => {
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
               .exportProviders({
                  provide: PaintingModuleTypes.IRandomArtTaskEngine,
                  useClass: RandomArtTaskEngine,
               })
         }
      },
   )
   .implementFeatureMethod((): DefaultDirector => {
      return (builder: IDynamicModuleBuilder): void => {
         builder.exportProviders({
            provide: PaintingModuleTypes.IRandomArtTaskEngine,
            useClass: RandomArtTaskEngine,
         })
      }
   })
   .implementFeatureRootImport()
   .build()

@Module({})
export class PaintingModule extends baseClass {}
