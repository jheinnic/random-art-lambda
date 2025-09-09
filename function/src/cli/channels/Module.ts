import { Module } from "@nestjs/common"
import { Chan, chan } from "medium"
import { CliChannelsModuleTypes } from "./Types.js"

@Module({
   imports: [],
   providers: [
      {
         provide: CliChannelsModuleTypes.RandomArtTaskCallChannel,
         // useFactory: (): Chan => chan(1),
         useFactory: (): { unwrap: () => Chan } => {
            const channel: Chan = chan(1)
            return { unwrap: () => channel }
         },
      },
      {
         provide: CliChannelsModuleTypes.RandomArtTaskReplyChannel,
         // useFactory: (): Chan => chan(1),
         useFactory: (): { unwrap: () => Chan } => {
            const channel: Chan = chan(1)
            return { unwrap: () => channel }
         },
      },
   ],
   exports: [
      CliChannelsModuleTypes.RandomArtTaskCallChannel,
      CliChannelsModuleTypes.RandomArtTaskReplyChannel,
   ],
})
export class CliChannelsModule {}
