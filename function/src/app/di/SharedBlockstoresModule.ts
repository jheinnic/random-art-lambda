import { Module } from "@nestjs/common"

import { IpfsModule } from "../../ipfs/di/IpfsModule.js"
import { SharedBlockstoresModuleTypes } from "./SharedBlockstoresModuleTypes.js"

@Module({
  imports: [
  IpfsModule.register(
    { rootPath: "/home/ionadmin/Documents/artBlocks", cacheSize: 500, injectToken: SharedBlockstoresModuleTypes.SharedArtBlockstore }
  ),
  IpfsModule.register(
    { rootPath: "/home/ionadmin/Documents/mapBlocks", cacheSize: 500, injectToken: SharedBlockstoresModuleTypes.SharedMapBlockstore }
  ),
  IpfsModule.register(
    { rootPath: "/home/ionadmin/Documents/taskBlocks", cacheSize: 500, injectToken: SharedBlockstoresModuleTypes.SharedTaskBlockstore }
  )
  ],
  exports: [IpfsModule]
  })
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-extraneous-class
export class SharedBlockstoresModule { }
