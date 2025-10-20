import {
   Inject,
   Injectable,
   Logger,
   OnApplicationBootstrap,
} from "@nestjs/common"
import { close, put, repeatTake, Chan } from "medium"
import { Canvas } from "canvas"

import { PaintingModuleTypes } from "../di/Types.js"
import type {
   IRegionMap,
   IRegionMapRepository,
} from "../../plotting/interface/index.js"
import type {
   AbstractRandomArtTaskCall,
   RandomArtTaskCall,
   RandomArtTaskReply,
   RandomArtTaskWordsCall,
} from "../message/index.js"
import type { IRandomArtTaskEngine } from "../interface/index.js"

import { GenModelArtist } from "./GenModelArtist.js"
import { GenModel, newPicture, substringChars } from "./genjs6.js"
import { ChannelWrapper } from "../../channels/ChannelWrapper.js"

@Injectable()
export class RandomArtTaskEngine implements IRandomArtTaskEngine {
   private readonly requests: Chan<RandomArtTaskCall>
   private readonly replies: Chan<RandomArtTaskReply>
   private handles: Array<Promise<void>>
   private readonly concurrency: number
   private readonly logger: Logger = new Logger("RandomArtTaskEngine")

   public constructor(
      @Inject(PaintingModuleTypes.InjectedRegionMapRepository)
      private readonly regionMapRepository: IRegionMapRepository,
      @Inject(PaintingModuleTypes.RandomArtTaskCallChannel)
      readonly requestsWrapper: ChannelWrapper<RandomArtTaskCall>,
      @Inject(PaintingModuleTypes.RandomArtTaskReplyChannel)
      readonly repliesWrapper: ChannelWrapper<RandomArtTaskReply>,
   ) {
      this.concurrency = 4
      this.handles = new Array<Promise<void>>(this.concurrency)
      this.requests = requestsWrapper.unwrap()
      this.replies = repliesWrapper.unwrap()
   }

   public async begin(): Promise<void> {
      for (let ii = 1; ii <= this.concurrency; ii++) {
         const seedRefs: WorkContext = {
            regionMapRepo: this.regionMapRepository,
            requests: this.requests,
            replies: this.replies,
            logger: new Logger(`SeedWorker${ii}`),
            workerId: ii,
         }
         this.handles[ii] = repeatTake(
            seedRefs.requests,
            performPaintTask,
            seedRefs,
         )
      }

      await Promise.all(this.handles)
   }

   /**
    * Force the service to complete by closing the Channel with its input requests.
    */
   public async stop(): Promise<void> {
      await close(this.requests)
   }
}

interface WorkContext {
   readonly regionMapRepo: IRegionMapRepository
   readonly requests: Chan<RandomArtTaskCall>
   readonly replies: Chan<RandomArtTaskReply>
   readonly logger: Logger
   readonly workerId: number
}

async function performPaintTask(
   nextTask: RandomArtTaskCall | RandomArtTaskWordsCall,
   context: WorkContext,
): Promise<false | WorkContext> {
   const genModel: GenModel =
      nextTask.inputKind === "PrefixSuffix"
         ? newPicture(nextTask.prefix, nextTask.suffix)
         : newPicture(
              substringChars(nextTask.prefix, 0, nextTask.prefix.length),
              substringChars(nextTask.suffix, 0, nextTask.suffix.length),
           )
   const request: AbstractRandomArtTaskCall = nextTask
   try {
      const regionMap: IRegionMap = await context.regionMapRepo.load(
         request.regionMap,
      )
      const canvas: Canvas = new Canvas(
         regionMap.pixelWidth,
         regionMap.pixelHeight,
         "image",
      )
      const artist: GenModelArtist = new GenModelArtist(genModel, canvas)
      await regionMap.directPlotter(artist)
      if (!(await put(context.replies, request.prepareReply(canvas)))) {
         return false
      }
   } catch (error) {
      const workerId: string = context.workerId.toString()
      const errorMsg: string = error.toString()
      context.logger.error(
         `Error processing task in worker ${workerId}: ${errorMsg}`,
      )
      await put(context.replies, request.prepareError(errorMsg))
      return false
   }

   return context
}
