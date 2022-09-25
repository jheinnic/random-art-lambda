import { Module } from "@nestjs/common"

import { RandomArtModule } from "../../domain/di/RandomArtModule.js"
import { IpfsModule } from "../../ipfs/di/IpfsModule.js"
import { AppService } from "../components/AppService.js"

@Module({
  imports: [
  RandomArtModule,
  IpfsModule.registerAsync({
    rootPath: "/home/ionadmin/Documents/ipfsDev",
    cacheSize: 300
    })
  ],
  providers: [AppService]
  })
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AppModule {}
