import { Module } from "@nestjs/common"
import { CoroutinesModule } from "../../coroutines/di/Module.js"
import { CliChannelsModuleTypes } from "./Types.js"

console.log("Check Import Order :: ", [
   CliChannelsModuleTypes.EnrollSourceFileCallChannel,
   CliChannelsModuleTypes.RandomArtChannelCallChannel,
   CliChannelsModuleTypes.EnrollSourceFileReplyChannel,
   CliChannelsModuleTypes.RandomArtChannelReplyChannel,
])
console.log("Check Import Order :: ", {
   [CliChannelsModuleTypes.EnrollSourceFileCallChannel]: 5,
   [CliChannelsModuleTypes.RandomArtChannelCallChannel]: 6,
   [CliChannelsModuleTypes.EnrollSourceFileReplyChannel]: 7,
   [CliChannelsModuleTypes.RandomArtChannelReplyChannel]: 8,
})

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
            "CliChannelsModuleTypes.EnrollSourceFileCallChannel": {
               component: "BlockingChannel",
               concurrency: 1,
            },
            "CliChannelsModuleTypes.EnrollSourceFileReplyChannel": {
               component: "BlockingChannel",
               concurrency: 1,
            },
         },
      }),
   ],
   providers: [
      {
         provide: CliChannelsModuleTypes.EnrollSourceFileCallChannel,
         useExisting: "CliChannelsModuleTypes.EnrollSourceFileCallChannel",
      },
      {
         provide: CliChannelsModuleTypes.EnrollSourceFileReplyChannel,
         useExisting: "CliChannelsModuleTypes.EnrollSourceFileReplyChannel",
      },
      {
         provide: CliChannelsModuleTypes.RandomArtChannelCallChannel,
         useExisting: "CliChannelsModuleTypes.RandomArtChannelCallChannel",
      },
      {
         provide: CliChannelsModuleTypes.RandomArtChannelReplyChannel,
         useExisting: "CliChannelsModuleTypes.RandomArtChannelReplyChannel",
      },
   ],
   exports: [
      // CoroutinesModule,
      CliChannelsModuleTypes.EnrollSourceFileCallChannel,
      CliChannelsModuleTypes.RandomArtChannelCallChannel,
      CliChannelsModuleTypes.EnrollSourceFileReplyChannel,
      CliChannelsModuleTypes.RandomArtChannelReplyChannel,
   ],
})
export class CliChannelsModule {}
