// import { InjectionToken } from "@nestjs/common"
import { Chan } from "medium"
import { IRegionMapRepository } from "../../plotting/interface/index.js"
import { RandomArtTaskCall } from "../message/RandomArtTaskCall.js"
import { RandomArtTaskReply } from "../message/RandomArtTaskReply.js"

/**
 * Paint Module is configurable by varying the implementation of the
 * repository it uses to fetch IRegionMaps fo:r the CID in a request object.
 */
export interface PaintingModuleConfiguration {
   readonly regionMapRepo: IRegionMapRepository
   readonly randomArtTaskCallChannel: Chan<RandomArtTaskCall>
   readonly randomArtTaskReplyChannel: Chan<RandomArtTaskReply>
}
