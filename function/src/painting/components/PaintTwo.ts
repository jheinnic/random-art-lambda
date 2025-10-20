import { Injectable, OnModuleDestroy, Inject, Logger } from "@nestjs/common"
import { Subject, takeUntil, Observable, merge, mergeMap, from } from "rxjs"
import { IRegionMapRepository } from "../../plotting/index.js"
import { PaintingModuleTypes } from "../di/Types.js"
import { RandomArtTaskCall } from "../message/RandomArtTaskCall.js"
import { RandomArtTaskReply } from "../message/RandomArtTaskReply.js"
import { RxChannel } from "../../channels/components/RxChannel.js"

@Injectable()
export class RandomArtTaskEngineRx implements OnModuleDestroy {
   private readonly requests: RxChannel<RandomArtTaskCall>
   private readonly replies: RxChannel<RandomArtTaskReply>
   private readonly concurrency = 4
   private readonly destroy$ = new Subject<void>()

   constructor(
      @Inject(PaintingModuleTypes.RandomArtTaskCallChannel)
      readonly requestsChannel: RxChannel<RandomArtTaskCall>,
      @Inject(PaintingModuleTypes.RandomArtTaskReplyChannel)
      readonly repliesChannel: RxChannel<RandomArtTaskReply>,
      @Inject(PaintingModuleTypes.InjectedRegionMapRepository)
      private readonly regionMapRepository: IRegionMapRepository,
   ) {
      this.requests = requestsChannel
      this.replies = repliesChannel
   }

   public begin(): void {
      // Create multiple concurrent processors
      const workers = Array(this.concurrency)
         .fill(0)
         .map((_, index) => this.createWorker(index + 1))

      // Merge all workers into single stream
      merge(...workers)
         .pipe(takeUntil(this.destroy$))
         .subscribe({
            next: (result) => this.replies.put(result),
            error: (err) => console.error("Worker error:", err),
            complete: () => console.log("All workers completed"),
         })
   }

   private createWorker(workerId: number): Observable<RandomArtTaskReply> {
      const context: WorkContext = {
         regionMapRepo: this.regionMapRepository,
         workerId,
         logger: new Logger(`Worker${workerId}`),
      }

      return this.requests.asObservable().pipe(
         // Process tasks with concurrency control
         mergeMap(
            (task) => from(this.performPaintTask(task, context)),
            1, // Sequential processing per worker
         ),
         takeUntil(this.destroy$),
      )
   }

   private async performPaintTask(
      task: RandomArtTaskCall,
      context: WorkContext,
   ): Promise<RandomArtTaskReply> {
      context.logger.log(`Processing task ${task.id}`)

      // Your existing paint logic
      const genModel =
         task.inputKind === "PrefixSuffix"
            ? await this.createGenModel(task)
            : await this.createFromWords(task)

      const regionMap = await context.regionMapRepo.load(task.regionMapId)
      const canvas = await this.paintWithModel(genModel, regionMap)

      return {
         id: task.id,
         status: "completed",
         outputPath: task.outputPath,
         canvas,
      }
   }

   public async stop(): Promise<void> {
      this.requests.close()
      this.destroy$.next()
      this.destroy$.complete()
   }

   onModuleDestroy() {
      this.stop()
   }
}
