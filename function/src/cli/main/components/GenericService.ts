import { Chan, take, put, close } from "medium"
import { Inject, Injectable, Logger } from "@nestjs/common"

import {
   RandomArtTaskCall,
   RandomArtTaskReply,
} from "../../../painting/message/index.js"
import {
   EnrollSourceFileCall,
   EnrollSourceFileReply,
} from "../../../plotting/protobuf/message/index.js"

import { ChannelWrapper } from "../../channels/ChannelWrapper.js"
import { IRandomArtTaskEngine } from "../../../painting/interface/index.js"
import { CliMainModuleTypes } from "../di/Types.js"

/**
 * A sample CLI command that takes an option and uses it to configure a service.
 */
@Injectable()
export class GenericService {
   private readonly inputFiles: Chan<EnrollSourceFileCall>
   private readonly returnCids: Chan<EnrollSourceFileReply>
   private readonly artworkRequests: Chan<RandomArtTaskCall>
   private readonly artworkReplies: Chan<RandomArtTaskReply>
   private readonly logger: Logger

   constructor(
      // @Inject(ProtobufPlottingModuleTypes.ProtobufRegionMapRepository)
      // private readonly pbufRepo: IRegionMapRepository,
      @Inject(CliMainModuleTypes.EnrollSourceFileCallChannel)
      readonly inputFilesWrapper: ChannelWrapper<EnrollSourceFileCall>,
      @Inject(CliMainModuleTypes.EnrollSourceFileReplyChannel)
      readonly returnCidsWrapper: ChannelWrapper<EnrollSourceFileReply>,
      @Inject(CliMainModuleTypes.RandomArtTaskCallChannel)
      readonly artworkRequestsWrapper: ChannelWrapper<RandomArtTaskCall>,
      @Inject(CliMainModuleTypes.RandomArtTaskReplyChannel)
      readonly artworkRepliesWrapper: ChannelWrapper<RandomArtTaskReply>,
      @Inject(CliMainModuleTypes.RandomArtTaskEngine)
      private readonly randomArtEngine: IRandomArtTaskEngine,
   ) {
      this.inputFiles = inputFilesWrapper.unwrap()
      this.returnCids = returnCidsWrapper.unwrap()
      this.artworkRequests = artworkRequestsWrapper.unwrap()
      this.artworkReplies = artworkRepliesWrapper.unwrap()
      this.logger = new Logger("GenericService")
   }

   /**
    * The main method executed when the command is run.
    * @param passedParams Any parameters passed without flags.
    * @param options An object containing parsed options.
    */
   async run(): Promise<void> {
      const inputs: EnrollSourceFileCall[] = [
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
                  this.logger.log("Received end of reply stream")
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

      this.logger.log(tracking)

      await this.randomArtEngine.begin()
      const msg = await take(this.returnCids)
      await this.randomArtEngine.stop()
      this.logger.log("Fin", msg)
   }
}
