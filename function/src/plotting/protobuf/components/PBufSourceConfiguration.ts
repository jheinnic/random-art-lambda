import { Injectable, Inject, Logger } from "@nestjs/common"
import { Chan, repeatTake, CLOSED, put, close } from "medium"
import { CID } from "multiformats"
import * as fs from "fs"

import { bytesToCIDv1 } from "./PBufUtil.js"
import { ProtobufPlottingModuleTypes } from "../di/Types.js"
import { ISourceConfiguration } from "../interface/index.js"
import {
   EnrollSourceFileCall,
   EnrollSourceFileReply,
} from "../message/index.js"
import { ChannelWrapper } from "../../../channels/ChannelWrapper.js"

@Injectable()
export class PBufSourceConfiguration implements ISourceConfiguration {
   private readonly fileSources: Chan<EnrollSourceFileCall>
   private readonly cidHandles: Chan<EnrollSourceFileReply>
   private readonly buffersByCid: Map<CID, Buffer> = new Map<CID, Buffer>()
   private ready: boolean = false
   private readonly logger: Logger = new Logger("PBufSourceConfiguration")

   /**
    * Prime the configuration with a list of name to file paths.
    * These must be loaded by awaiting a call to loadCids() before
    * during the use of this object to create a PBufRepo.
    *
    * @param sources A map of source names to their file paths.
    */
   constructor(
      @Inject(ProtobufPlottingModuleTypes.EnrollSourceFileCallChannel)
      readonly fileSourcesWrapper: ChannelWrapper<EnrollSourceFileCall>,
      @Inject(ProtobufPlottingModuleTypes.EnrollSourceFileReplyChannel)
      readonly cidHandlesWrapper: ChannelWrapper<EnrollSourceFileReply>,
   ) {
      this.fileSources = fileSourcesWrapper.unwrap()
      this.cidHandles = cidHandlesWrapper.unwrap()
   }

   private async loadMaps(): Promise<void> {
      if (!this.ready) {
         await repeatTake(
            this.fileSources,
            loadSourceFile,
            new WorkContext(this.buffersByCid, this.cidHandles, this.logger),
         )

         this.logger.log("Received end-of-stream")
         await close(this.cidHandles)
         this.ready = true
      }
   }

   public async getBuffersByCid(): Promise<Map<CID, Buffer>> {
      if (!this.ready) {
         await this.loadMaps()
      }

      return new Map(this.buffersByCid)
   }
}

class WorkContext {
   constructor(
      public readonly buffersByCid: Map<CID, Buffer>,
      public readonly cidHandles: Chan<EnrollSourceFileReply>,
      public readonly logger: Logger,
   ) {}
}

async function loadSourceFile(
   nextTask: EnrollSourceFileCall | typeof CLOSED,
   context: WorkContext,
): Promise<false | WorkContext> {
   if (typeof nextTask === "symbol") {
      context.logger.log("Received end-of-stream")
      await close(context.cidHandles)
      return false
   }

   context.logger.log(`Received ${JSON.stringify(nextTask)}`)
   const result = await fs.promises
      .readFile(nextTask.filePath)
      .then(async (buffer: Buffer) => {
         const cid = await bytesToCIDv1(buffer)
         context.buffersByCid.set(cid, buffer)
         await put(context.cidHandles, nextTask.prepareReply(cid))
         context.logger.log(
            `Put reply to sender for ${nextTask.correlationId}.`,
         )

         return context
      })
      .catch(async (x: Error) => {
         context.logger.log(
            `Sending error to sender for ${nextTask.correlationId}.`,
         )
         await put(context.cidHandles, nextTask.prepareError(x.message))
         context.logger.log(
            `Put error to sender for ${nextTask.correlationId}.`,
         )

         return undefined
      })

   if (result === undefined) {
      return false
   }
   return result
}

/*
         const buffers: Buffer[] = await Promise.all(
            this.sourcesByName.map(async (entry: [string, string | Buffer]) => {
               const [name, source] = entry
               return source instanceof Buffer
                  ? source
                  : await fs.promises.readFile(source).catch((x: Error) => {
                       this.errorsByName[name] = x.message
                    })
            }),
         )
         for (const x of buffers) {
            const cid = await bytesToCIDv1(x)
            this.buffersByCid.set(cid, x)
         }
         this.ready = true
         if (Object.keys(this.errorsByName).length > 0) {
            throw new Error(
               `Failed to load sources: ${JSON.stringify(this.errorsByName)}`,
            )
         }
this.ready = true
if (Object.keys(this.errorsByName).length > 0) {
   throw new Error(
      `Failed to load sources: ${JSON.stringify(this.errorsByName)}`,
   )
}
      }
      */
