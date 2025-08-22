import { Module } from "@nestjs/common"
import { CoroutinesModule } from "../../coroutines/di/Module.js"
import { CliChannelsModuleTypes } from "./Types.js"

@Module({
   imports: [
      CoroutinesModule.register({
         requests: {
            [CliChannelsModuleTypes.RandomArtTaskCallChannel]: {
               component: "BlockingChannel",
               concurrency: 3,
            },
            [CliChannelsModuleTypes.RandomArtTaskReplyChannel]: {
               component: "BlockingChannel",
               concurrency: 3,
            },
            [CliChannelsModuleTypes.EnrollSourceFileCallChannel]: {
               component: "BlockingChannel",
               concurrency: 1,
            },
            [CliChannelsModuleTypes.EnrollSourceFileReplyChannel]: {
               component: "BlockingChannel",
               concurrency: 1,
            },
         },
      }),
   ],
   providers: [],
   exports: [CoroutinesModule],
})
export class CliChannelsModule {}
