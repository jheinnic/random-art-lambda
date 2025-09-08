import { Inject, Injectable } from "@nestjs/common"
import { CID } from "multiformats"
import { Canvas } from "canvas"
import { sha256 as hasher } from "multiformats/hashes/sha2"
import crypto from "crypto"
import fs from "fs"

import type {
   IRegionMapRepository,
   IRegionMap,
} from "../../plotting/interface/index.js"
import { GenModelArtist } from "../../painting/components/GenModelArtist.js"
import {
   GenModel,
   newPicture,
   oldPicture,
} from "../../painting/components/genjs6.js"
import { IpldPlottingModuleTypes } from "../../plotting/ipld/di/Types.js"
import { PBufRegionMapFactory } from "../../plotting/protobuf/components/PBufRegionMapFactory.js"
import { ProtobufPlottingModuleTypes } from "../../plotting/protobuf/di/Types.js"
import { PBufRegionMap } from "../../plotting/protobuf/components/PBufRegionMap.js"
import { CanvasPersister } from "../../painting/components/CanvasPersister.js"

interface Task {
   taskMessage: string
   genModel: GenModel
   fileName: string
}
interface Region {
   name: string
   regionMap: IRegionMap | undefined
}

@Injectable()
export class AppServiceTwo {
   private readonly cidCache: Map<CID, IRegionMap> = new Map()

   public constructor(
      @Inject(IpldPlottingModuleTypes.IpldRegionMapRepository)
      private readonly mapRepo: IRegionMapRepository,
      @Inject(ProtobufPlottingModuleTypes.ProtobufRegionMapFactory)
      private readonly regionMapFactory: PBufRegionMapFactory,
      // @Inject( PaintingModuleTypes.IRandomArtPainter )
      // @Inject( PaintingModuleTypes.IRandomArtTaskEngine )
      // private readonly taskRepo: IRandomArtTaskEngine,
   ) {}

   public async testRepo(cid: CID): Promise<IRegionMap | undefined> {
      if (!this.cidCache.has(cid)) {
         await this.mapRepo.load(cid).then((loadedMap) => {
            console.log("Repo loaded:")
            console.log(loadedMap)
            if (!this.cidCache.has(cid)) {
               this.cidCache.set(cid, loadedMap)
            }
         })
      }
      return this.cidCache.get(cid)
   }

   public async testRepoSave(): Promise<void> {
      const adapter: PBufRegionMap =
         this.regionMapFactory.adapt("./qdoc2.proto")
      const modelCid: CID = await this.mapRepo.import(adapter.directBuilder)
      const origMap: IRegionMap = adapter
      console.log(origMap)
      console.log(modelCid)
      const loadedMap: IRegionMap = await this.mapRepo.load(modelCid)
      console.log(loadedMap)
      if (!this.cidCache.has(modelCid)) {
         this.cidCache.set(modelCid, loadedMap)
      }
      const taskList: Task[] = this.getAWorkList()
      const regionList: Region[] = [
         { name: "qdoc2", regionMap: this.cidCache.get(modelCid) },
      ]
      await this.runCombinations(taskList, regionList)
   }

   public async testRun0(): Promise<void> {
      const beginString: string = "Happy Thanksgiving Burger"
      const beginBuf: Buffer = Buffer.from(beginString)
      const beginArray: Uint8Array = Uint8Array.from(beginBuf)

      const adapter: PBufRegionMap =
         this.regionMapFactory.adapt("./qdoc2.proto")
      const regionMap: IRegionMap = adapter

      let hashBuf = beginArray
      while (true) {
         hashBuf = await hasher.encode(hashBuf)
         const prefix = hashBuf.slice(0, 16)
         const suffix = hashBuf.slice(16)
         const prefixStr = Buffer.from(prefix).toString("hex")
         const suffixStr = Buffer.from(suffix).toString("hex")
         const fileName = `./${prefixStr}_${suffixStr}.png`
         const genModel: GenModel = newPicture([...prefix], [...suffix])
         await this.doOne(genModel, regionMap, fileName)
      }
   }

   public async testRun1(): Promise<void> {
      const workList: Array<{ prefix: string; suffix: string }> = JSON.parse(
         fs.readFileSync("source.list").toString(),
      )
      const taskList: Task[] = workList.map(
         (task: { prefix: string; suffix: string }) => {
            let buf: Buffer = Buffer.from(task.prefix, "hex")
            const prefix: Uint8Array = Uint8Array.from(buf)
            buf = Buffer.from(task.suffix, "hex")
            const suffix: Uint8Array = Uint8Array.from(buf)
            return {
               taskMessage: JSON.stringify(task),
               genModel: newPicture([...prefix], [...suffix]),
               fileName: `${task.prefix}_${task.suffix}.png`,
            }
         },
      )

      const sourceNames: string[] = ["qdoc4", "qdoc5", "qdoc6"]
      const regionList: Region[] = sourceNames.map((sourceName: string) => {
         const adapter: PBufRegionMap = this.regionMapFactory.adapt(
            `./${sourceName}.proto`,
         )
         return { name: sourceName, regionMap: adapter }
      })

      return await this.runCombinations(taskList, regionList)
   }

   public getAWorkList(): Task[] {
      const workList: Array<{ phrase: string }> = JSON.parse(
         fs.readFileSync("source5B.list").toString(),
      )
      return workList.map((task: { phrase: string }): Task => {
         const fileName: string = crypto
            .createHash("md5")
            .update(task.phrase)
            .digest()
            .toString("base64")
            .replaceAll("/", "_")
            .replaceAll("=", "")
         return {
            taskMessage: JSON.stringify(task),
            genModel: oldPicture(task.phrase),
            fileName: `${fileName}.png`,
         }
      })
   }

   public async testRun(): Promise<void> {
      const taskList: Task[] = this.getAWorkList()

      // const sourceNames: string[] = [ "qdoc4", "qdoc5", "qdoc6" ]
      const sourceNames: string[] = ["rdoc03"]
      const regionList: Region[] = sourceNames.map((sourceName: string) => {
         const adapter: PBufRegionMap = this.regionMapFactory.adapt(
            `./${sourceName}.proto`,
         )
         return { name: sourceName, regionMap: adapter }
      })

      return await this.runCombinations(taskList, regionList)
   }

   public async runCombinations(
      taskList: Task[],
      regionList: Region[],
   ): Promise<void> {
      let task: Task
      for (task of taskList) {
         await Promise.all(
            regionList.map(async (region: Region) => {
               const fileName = `./${region.name}/${task.fileName}`
               const regionMap = region.regionMap
               if (regionMap === undefined) {
                  throw new Error("region.regionMap must be defined")
               }
               await this.doOne(
                  task.genModel,
                  regionMap,
                  fileName,
                  task.taskMessage,
               )
            }),
         )
      }
   }

   private async doOne(
      genModel: GenModel,
      regionMap: IRegionMap,
      fileName: string,
      taskMessage: string = "",
   ): Promise<void> {
      const canvas: Canvas = new Canvas(
         regionMap.pixelWidth,
         regionMap.pixelHeight,
         "image",
      )
      const artist: GenModelArtist = new GenModelArtist(genModel, canvas)
      await regionMap.directPlotter(artist)
      const stream = fs.createWriteStream(fileName)
      const persister: CanvasPersister = new CanvasPersister(canvas, stream)
      if (taskMessage !== "") {
         const sidecarFile = fileName.replace("png", "json")
         fs.writeFileSync(sidecarFile, taskMessage)
      }
      await persister.finish()
   }
}
