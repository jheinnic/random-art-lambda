import { Chan, take, put, close } from "medium"
import { Inject, Injectable, Logger } from "@nestjs/common"
import { Barrier } from "@nestjs/core/helpers/barrier.js"

import {
   RandomArtTaskCall,
   RandomArtTaskReply,
   RandomArtTaskWordsCall,
} from "../../../painting/message/index.js"
import {
   EnrollSourceFileCall,
   EnrollSourceFileReply,
} from "../../../plotting/protobuf/message/index.js"

import { ChannelWrapper } from "../../channels/ChannelWrapper.js"
import { IRandomArtTaskEngine } from "../../../painting/interface/index.js"
import { CliMainModuleTypes } from "../di/Types.js"
import { PBufRegionMapRepository } from "../../../plotting/protobuf/components/PBufRegionMapRepository.js"

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
   private readonly inputs: readonly EnrollSourceFileCall[]
   private readonly tracking: Record<
      string,
      EnrollSourceFileCall | EnrollSourceFileReply
   >

   private readonly repoBarrier: Barrier
   private readonly initRepo: Promise<void>

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
      @Inject(CliMainModuleTypes.RegionMapRepository)
      private readonly regionMapRepository: PBufRegionMapRepository,
      @Inject(CliMainModuleTypes.RandomArtTaskEngine)
      private readonly randomArtEngine: IRandomArtTaskEngine,
   ) {
      this.inputFiles = inputFilesWrapper.unwrap()
      this.returnCids = returnCidsWrapper.unwrap()
      this.artworkRequests = artworkRequestsWrapper.unwrap()
      this.artworkReplies = artworkRepliesWrapper.unwrap()
      this.logger = new Logger("GenericService")
      this.inputs = [
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
      this.tracking = {}
      this.repoBarrier = new Barrier(this.inputs.length)
      this.initRepo = this.regionMapRepository.init()
   }

   /**
    * The main method executed when the command is run.
    * @param passedParams Any parameters passed without flags.
    * @param options An object containing parsed options.
    */
   async run(): Promise<void> {
      const tracking: Record<
         string,
         EnrollSourceFileCall | EnrollSourceFileReply
      > = {}
      const sending = Promise.all(
         this.inputs.map(async (next: EnrollSourceFileCall) => {
            this.tracking[next.correlationId] = next
            this.logger.log(
               `Sending ${next.filePath} for registration as ${next.correlationId}`,
            )
            this.logger.log(JSON.stringify(this.tracking))
            await put(this.inputFiles, next)
         }),
      )
      this.logger.log("Started sending.  Watching for complete.")
      const initDone = this.watchForInitDone()
      this.logger.log("Now watching for replies")
      const receiveReplies = this.receiveReplies()
      await initDone
      this.logger.log("Async receive returned")
      await sending
      this.logger.log("Done receiving")
      await receiveReplies
      this.logger.log(JSON.stringify(this.tracking))

      const engineShutdown = this.randomArtEngine.begin()
      this.logger.log("Start and stop")
      const item = Object.values(this.tracking)[0]
      if (item instanceof EnrollSourceFileReply) {
         const cid = item.cid
         if (cid === undefined) {
            this.logger.error("Got a null CID from a file")
         } else {
            const message = new RandomArtTaskWordsCall(
               "Happy",
               "Fiddlesticks",
               cid,
            )
            await put(this.artworkRequests, message)
            const reply: RandomArtTaskReply | symbol = await take(
               this.artworkReplies,
            )
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
         }
      }
      await close(this.artworkRequests)
      await engineShutdown

      this.logger.log("Fin")
   }

   async watchForInitDone(): Promise<void> {
      await this.repoBarrier.wait()
      this.logger.log("Barrier threshold crossed")
      await close(this.inputFiles)
      this.logger.log("Closed input")
      await this.initRepo
      this.logger.log("Initialized repository!")
   }

   async receiveReplies(): Promise<void> {
      this.logger.log("Waiting for next reply...")
      while (true) {
         const reply: symbol | EnrollSourceFileReply = await take(
            this.returnCids,
         )
         if (typeof reply === "symbol") {
            this.logger.log("Last reply...")
            return
         }
         this.logger.log("Received a reply...")
         this.tracking[reply.correlationId] = reply
         this.logger.log(JSON.stringify(this.tracking))
         this.repoBarrier.signal()
      }
   }
}
