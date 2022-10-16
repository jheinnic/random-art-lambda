import { Module } from "@nestjs/common"

import { IpfsModule } from "./IpfsModule.js"
import { SharedArtBlockstoreModuleTypes } from "./typez.js"

@Module({
  imports: [IpfsModule.register(
    { rootPath: "/home/ionadmin/Documents/raBlocks", cacheSize: 500, injectToken: SharedArtBlockstoreModuleTypes.SharedArtBlockstore }
  )],
  exports: [IpfsModule]
  })
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-extraneous-class
export class SharedArtBlockstoreModule { }
