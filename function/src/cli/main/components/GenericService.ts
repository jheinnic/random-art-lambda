import { Inject, Injectable, Logger } from "@nestjs/common"
// import { Barrier } from "@nestjs/core/helpers/barrier.js"

import { CliMainModuleTypes } from "../di/Types.js"
import { RandomArtFlowProducer } from "../../../painting/queue/components/RandomArtFlowProducer.js"
// import { IRxLocalCallChannel } from "../../../channels/interface/index.js"
import type { PartialPaintRequest } from "../../../painting/messages/dto/PartialPaintRequest.js"
import type { PartialPaintResult } from "../../../painting/messages/dto/PartialPaintResult.js"

/**
 * A sample CLI command that takes an option and uses it to configure a service.
 */
@Injectable()
export class GenericService {
   run(): any {
      throw new Error("Method not implemented.")
   }

   private readonly logger: Logger

   constructor(
      // @Inject(ProtobufPlottingModuleTypes.ProtobufRegionMapRepository)
      // private readonly pbufRepo: IRegionMapRepository,
      @Inject(CliMainModuleTypes.RandomArtTaskCallChannel)
      // readonly artworkRequests: IRxLocalCallChannel<
      //    PartialPaintRequest,
      //    PartialPaintResult
      // >,
      // @Inject(CliMainModuleTypes.RandomArtTaskReplyChannel)
      // readonly artworkRepliesWrapper: ChannelWrapper<RandomArtTaskReply>,
      // @Inject(CliMainModuleTypes.RegionMapRepository)
      // private readonly regionMapRepository: IRegionMapRepository,
      // @Inject(CliMainModuleTypes.RandomArtTaskEngine)
      // private readonly randomArtEngine: IRandomArtTaskEngine,
      @Inject(CliMainModuleTypes.RandomArtQueueFlowProducer)
      private readonly flowProducer: RandomArtFlowProducer<object, object>,
   ) {
      this.logger = new Logger("GenericService")
   }
}
