import { Module } from "@nestjs/common"

import { IpfsModule } from "../../../ipfs/di/Module.js"
import { SharedBlockstoresModuleTypes } from "./SharedBlockstoresModuleTypes.js"

@Module({
   imports: [
      IpfsModule.register({
         rootPath: "/home/ionadmin/Documents/artBlocks",
         cacheSize: 500,
         injectToken: SharedBlockstoresModuleTypes.SharedArtBlockstore,
         readOnly: true,
      }),
      IpfsModule.register({
         rootPath: "/home/ionadmin/Documents/mapBlocks",
         cacheSize: 4000,
         injectToken: SharedBlockstoresModuleTypes.RegionMapBlockstore,
         readOnly: false,
      }),
      IpfsModule.register({
         rootPath: "/home/ionadmin/Documents/taskBlocks",
         cacheSize: 500,
         injectToken: SharedBlockstoresModuleTypes.SharedTaskBlockstore,
         readOnly: true,
      }),
   ],
   exports: [IpfsModule],
})
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-extraneous-class
export class SharedBlockstoresModule {}
