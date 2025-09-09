import { DynamicModule, Module } from "@nestjs/common"
import { ConduitModuleFactory } from "../../di/ConduitModuleFactory.js"

import { buildLruCache, FsBlockstore } from "../components/FsBlockstore.js"
import {
   ASYNC_OPTIONS_TYPE,
   ConfigurableModuleClass,
   OPTIONS_TYPE,
} from "./IpfsModuleDefinition.js"
import { IpfsModuleTypes } from "./IpfsModuleTypes.js"

const BaseClass =
   new ConduitModuleFactory() <
   @Module({
      providers: [
         {
            provide: IpfsModuleTypes.LruCache,
            useFactory: buildLruCache,
            inject: [IpfsModuleTypes.FsBlockstoreConfiguration],
         },
         {
            provide: IpfsModuleTypes.AbstractBlockstore,
            useClass: FsBlockstore,
         },
      ],
      exports: [IpfsModuleTypes.AbstractBlockstore],
   })
   export class IpfsModule extends ConfigurableModuleClass {}
