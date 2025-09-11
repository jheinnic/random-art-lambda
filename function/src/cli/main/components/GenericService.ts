import { Chan, take, put, close } from "medium"
import { Inject, Injectable, Logger } from "@nestjs/common"
// import { Barrier } from "@nestjs/core/helpers/barrier.js"
import { CID } from "multiformats"

import { CliMainModuleTypes } from "../di/Types.js"
import { IRandomArtTaskEngine } from "../../../painting/interface/index.js"
import { ChannelWrapper } from "../../../channels/ChannelWrapper.js"
import {
   RandomArtTaskCall,
   RandomArtTaskReply,
   RandomArtTaskWordsCall,
} from "../../../painting/message/index.js"
import { PBufRegionMapRepository } from "../../../plotting/protobuf/components/PBufRegionMapRepository.js"

/**
 * A sample CLI command that takes an option and uses it to configure a service.
 */
@Injectable()
export class GenericService {
   private readonly artworkRequests: Chan<RandomArtTaskCall>
   private readonly artworkReplies: Chan<RandomArtTaskReply>
   private readonly logger: Logger

   constructor(
      // @Inject(ProtobufPlottingModuleTypes.ProtobufRegionMapRepository)
      // private readonly pbufRepo: IRegionMapRepository,
      @Inject(CliMainModuleTypes.RandomArtTaskCallChannel)
      readonly artworkRequestsWrapper: ChannelWrapper<RandomArtTaskCall>,
      @Inject(CliMainModuleTypes.RandomArtTaskReplyChannel)
      readonly artworkRepliesWrapper: ChannelWrapper<RandomArtTaskReply>,
      @Inject(CliMainModuleTypes.RegionMapRepository)
      private readonly regionMapRepository: PBufRegionMapRepository,
      @Inject(CliMainModuleTypes.RandomArtTaskEngine)
      private readonly randomArtEngine: IRandomArtTaskEngine,
   ) {
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
      const engineShutdown = this.randomArtEngine.begin()
      this.logger.log("Start and stop")
      const message = new RandomArtTaskWordsCall(
         "Happy",
         "Fiddlesticks",
         CID.parse(
            "bafyreiexe6npphnaou2tz7jdbwtgh2wnfdbsnbti22smksport4sqr7bgu",
         ),
      )
      await put(this.artworkRequests, message)
      const reply: RandomArtTaskReply | symbol = await take(this.artworkReplies)
      if (typeof reply === "symbol") {
         this.logger.log("Got end of stream")
      } else {
         const canvas = reply.canvas
         if (canvas !== undefined) {
            this.logger.log("Successful painting!")
         } else {
            this.logger.error(reply.error)
         }
      }
      await close(this.artworkRequests)
      await engineShutdown

      this.logger.log("Fin")
   }
}
