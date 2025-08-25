import { Command, CommandRunner, Option } from "nest-commander"
import { Chan, take, put, close } from "medium"
import { Inject } from "@nestjs/common"

import { CliMainModuleTypes } from "../di/Types.js"
import {
   RandomArtTaskCall,
   RandomArtTaskReply,
} from "../../../painting/message"
import {
   EnrollSourceFileCall,
   EnrollSourceFileReply,
} from "../../../plotting/protobuf/message/index.js"
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
      @Inject(CliMainModuleTypes.EnrollSourceFileCallChannel)
      private readonly inputFiles: Chan<EnrollSourceFileCall>,
      @Inject(CliMainModuleTypes.EnrollSourceFileReplyChannel)
      private readonly returnCids: Chan<EnrollSourceFileReply>,
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
   ): Promise<void> {
      const inputs = [
         new EnrollSourceFileCall(
            "/home/ionadmin/Git/lambdas/random-art-lambda/function/rdoc01.proto",
         ),
         new EnrollSourceFileCall(
            "/home/ionadmin/Git/lambdas/random-art-lambda/function/rdoc02.proto",
         ),
         new EnrollSourceFileCall(
            "/home/ionadmin/Git/lambdas/random-art-lambda/function/rdoc03.proto",
         ),
         new EnrollSourceFileCall(
            "/home/ionadmin/Git/lambdas/random-art-lambda/function/tdoc01.proto",
         ),
      ]
      const tracking: Record<
         string,
         EnrollSourceFileCall | EnrollSourceFileReply
      > = {}
      const sendAll = Promise.all(
         inputs.map(async (next: EnrollSourceFileCall) => {
            tracking[next.correlationId] = next
            await put(this.inputFiles, next)
            return next
         }),
      )
      const receiveAll: Promise<Array<EnrollSourceFileReply | boolean>> =
         Promise.all(
            inputs.map(async () => {
               const next: symbol | EnrollSourceFileReply = await take(
                  this.returnCids,
               )
               if (typeof next === "symbol") {
                  console.log("Received end of reply stream")
                  return false
               }
               tracking[next.correlationId] = next
               if (next.isError()) {
                  throw new Error(next.error)
               }
               return next
            }),
         )
      await sendAll
      await receiveAll
      await close(this.inputFiles)

      console.log(tracking)

      await this.randomArtEngine.begin()
      const msg = await take(this.returnCids)
      await this.randomArtEngine.stop()
      console.log("Fin", msg)
   }

   /**
    * Defines a command-line option.
    */
   @Option({
      flags: "-c, --network-config <value>",
      description: "The configuration string for the network adapter",
      required: true, // Mark as required
   })
   parseNetworkConfig(val: string): string {
      return val
   }
}
