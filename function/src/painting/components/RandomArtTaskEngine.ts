import { Inject, Injectable } from "@nestjs/common"
import { close, put, repeatTake, Chan, CLOSED } from "medium"
import { Canvas } from "canvas"

import { PaintingModuleTypes } from "../di/Types.js"
import type {
   IRegionMap,
   IRegionMapRepository,
} from "../../plotting/interface/index.js"
import type { RandomArtTaskCall, RandomArtTaskReply } from "../message/index.js"
import type { IRandomArtTaskEngine } from "../interface/index.js"

import { GenModelArtist } from "./GenModelArtist.js"
import { GenModel, newPicture } from "./genjs6.js"

@Injectable()
export class RandomArtTaskEngine implements IRandomArtTaskEngine {
   private handles: Array<Promise<void>>
   private readonly concurrency: number

   public constructor(
      @Inject(PaintingModuleTypes.InjectedRegionMapRepository)
      private readonly regionMapRepository: IRegionMapRepository,
      @Inject(PaintingModuleTypes.RandomArtTaskCallChannel)
      private readonly requests: Chan<RandomArtTaskCall>,
      @Inject(PaintingModuleTypes.RandomArtTaskReplyChannel)
      private readonly replies: Chan<RandomArtTaskReply>,
   ) {
      this.concurrency = 4
      this.handles = new Array<Promise<void>>(this.concurrency)
   }

   public async begin(): Promise<void> {
      for (let ii = 1; ii <= this.concurrency; ii++) {
         const seedRefs: WorkContext = {
            regionMapRepo: this.regionMapRepository,
            requests: this.requests,
            replies: this.replies,
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

   public async stop(): Promise<void> {
      await close(this.requests)
   }
}

interface WorkContext {
   readonly regionMapRepo: IRegionMapRepository
   readonly requests: Chan<RandomArtTaskCall>
   readonly replies: Chan<RandomArtTaskReply>
   readonly workerId: number
}

async function performPaintTask(
   nextTask: RandomArtTaskCall | typeof CLOSED,
   context: WorkContext,
): Promise<false | WorkContext> {
   if (typeof nextTask === "symbol") {
      return false
   }

   // const prefix = [...request.prefix]
   // const suffix = [...request.suffix]
   const genModel: GenModel = newPicture(nextTask.prefix, nextTask.suffix)
   const request: RandomArtTaskCall = nextTask
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
      await put(context.replies, request.prepareReply(canvas))
   } catch (error) {
      const workerId: string = context.workerId.toString()
      const errorMsg: string = error.toString()
      console.error(`Error processing task in worker ${workerId}: ${errorMsg}`)
      return false
      // TODO
      // await replyChannel.put(
      // nextTask.prepareAmbush()
      //
   }

   return context
}
