import { Module } from "@nestjs/common"
import { Chan, chan } from "medium"
import { Subject } from "rxjs"
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
      {
         provide: CliChannelsModuleTypes.EnrollSourceFileCallChannel,
         useClass: Subject,
      },
      {
         provide: CliChannelsModuleTypes.EnrollSourceFileReplyChannel,
         useClass: Subject,
      },
   ],
   exports: [
      CliChannelsModuleTypes.RandomArtTaskCallChannel,
      CliChannelsModuleTypes.RandomArtTaskReplyChannel,
      CliChannelsModuleTypes.EnrollSourceFileCallChannel,
      CliChannelsModuleTypes.EnrollSourceFileReplyChannel,
   ],
})
export class CliChannelsModule {}
