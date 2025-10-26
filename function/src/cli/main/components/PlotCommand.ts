import { Command, CommandRunner } from "nest-commander"
import { Chan } from "medium"
import { Inject } from "@nestjs/common"

import { CliMainModuleTypes } from "../di/Types.js"
import {
   RandomArtTaskCall,
   RandomArtTaskReply,
} from "../../../painting/message"
import { IRandomArtTaskEngine } from "../../../painting/index.js"
/**
 * A sample CLI command that takes an option and uses it to configure a service.
 */
@Command({
   name: "plot",
   description: "Runs a network operation with provided config",
})
export class PlotCommand extends CommandRunner {
   constructor(
      // private readonly dummy: Dummy,
      // @Inject(ProtobufPlottingModuleTypes.ProtobufRegionMapRepository)
      // pbufRepo: IRegionMapRepository,
      @Inject(CliMainModuleTypes.RandomArtTaskCallChannel)
      private readonly artworkRequests: Chan<RandomArtTaskCall>,
      @Inject(CliMainModuleTypes.RandomArtTaskReplyChannel)
      private readonly artworkReplies: Chan<RandomArtTaskReply>,
      @Inject(CliMainModuleTypes.RandomArtTaskEngine)
      private readonly randomArtEngine: IRandomArtTaskEngine,
   ) {
      super()
   }

   /**
    * The main method executed when the command is run.
    * @param passedParams Any parameters passed without flags.
    * @param options An object containing parsed options.
    */
   async run(
      _passedParams: string[],
      _options?: {
         networkConfig: string
      },
   ): Promise<void> {}
}
