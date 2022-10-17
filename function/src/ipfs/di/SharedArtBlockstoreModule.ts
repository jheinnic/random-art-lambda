import { Module } from "@nestjs/common"

import { IpfsModule } from "./IpfsModule.js"
import { SharedArtBlockstoreModuleTypes } from "./typez.js"

@Module({
  imports: [
  IpfsModule.register(
    { rootPath: "/home/ionadmin/Documents/artBlocks", cacheSize: 500, injectToken: SharedArtBlockstoreModuleTypes.SharedArtBlockstore }
  ),
  IpfsModule.register(
    { rootPath: "/home/ionadmin/Documents/mapBlocks", cacheSize: 500, injectToken: SharedArtBlockstoreModuleTypes.SharedMapBlockstore }
  ),
  IpfsModule.register(
    { rootPath: "/home/ionadmin/Documents/taskBlocks", cacheSize: 500, injectToken: SharedArtBlockstoreModuleTypes.SharedTaskBlockstore }
  )
  ],
  exports: [IpfsModule]
  })
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-extraneous-class
export class SharedArtBlockstoreModule { }
