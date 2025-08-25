import { Module } from "@nestjs/common"
import { Chan, chan } from "medium"
import { CliChannelsModuleTypes } from "./Types.js"

@Module({
   imports: [],
   providers: [
      {
         provide: CliChannelsModuleTypes.EnrollSourceFileCallChannel,
         // useFactory: (): Chan => chan(1),
         useFactory: (): { unwrap: () => Chan } => {
            const channel: Chan = chan(1)
            return { unwrap: () => channel }
         },
      },
      {
         provide: CliChannelsModuleTypes.EnrollSourceFileReplyChannel,
         // useFactory: (): Chan => chan(1),
         useFactory: (): { unwrap: () => Chan } => {
            const channel: Chan = chan(1)
            return { unwrap: () => channel }
         },
      },
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
      CliChannelsModuleTypes.EnrollSourceFileCallChannel,
      CliChannelsModuleTypes.EnrollSourceFileReplyChannel,
      CliChannelsModuleTypes.RandomArtTaskCallChannel,
      CliChannelsModuleTypes.RandomArtTaskReplyChannel,
   ],
})
export class CliChannelsModule {}
