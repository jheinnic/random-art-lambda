// import { ScatterGatherTask } from "../../../messages/interface/ScatterGatherTask"
import { Inject, Injectable } from "@nestjs/common"
import { CID } from "multiformats"
import { Canvas } from "canvas"
import { sha256 as hasher } from "multiformats/hashes/sha2"
import { createHash, generateKeyPairSync } from "crypto"
import fs from "fs"

import type {
   IRegionMapRepository,
   IRegionMap,
} from "../../../plotting/interface/index.js"
import { GenModelArtist } from "../../../painting/artwork/components/GenModelArtist.js"
import {
   GenModel,
   newPicture,
} from "../../../painting/artwork/components/genjs6.js"
import { GenJs6Model } from "../../../painting/artwork/components/GenJs6Provider.js"

// SHELVED: Seeding extension system moved to attic/
// import { SeedingModuleTypes } from "../../../painting/seeding/di/Types.js"
// import type { IPhraseSeed } from "../../../painting/seeding/builtin/interface/index.js"
// import { IGMSeedExtensionPoint } from "../../../painting/seeding/interface/IGMSeedExtensionPoint.js"
import { IpldPlottingModuleTypes } from "../../../plotting/ipld/di/Types.js"
import { ProtobufPlottingModuleTypes } from "../../../plotting/protobuf/di/Types.js"

import { PBufRegionMapFactory } from "../../../plotting/protobuf/components/PBufRegionMapFactory.js"
import { PBufRegionMap } from "../../../plotting/protobuf/components/PBufRegionMap.js"
import { CanvasPersister } from "../../../painting/artwork/components/CanvasPersister.js"
// import { RANDOM_ART_LOCAL_CALLS_CHANNEL } from "../../di/Types._st"
// import { IRxLocalCallChannel } from "../../../channels/interface/IRxLocalCallChannel.js"
import { QueuedPaintingTypes } from "../../../painting/queue/di/Types.js"
import { RandomArtFlowProducer } from "../../../painting/queue/components/RandomArtFlowProducer.js"
// import { PaintableSeed } from "../../../painting/seeding/models/index.js"
// import { of } from "rxjs"  // SHELVED: was only used in useSeeder()
// import { ScatterGatherTaskImpl } from "../../../channels/components/ScatterGatherTaskImpl.js"

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
export class AppService {
   private readonly cidCache: Map<CID, IRegionMap> = new Map()

   public constructor(
      @Inject(IpldPlottingModuleTypes.IpldRegionMapRepository)
      private readonly mapRepo: IRegionMapRepository,
      @Inject(ProtobufPlottingModuleTypes.ProtobufRegionMapFactory)
      private readonly regionMapFactory: PBufRegionMapFactory,
      // @Inject( PaintingModuleTypes.IRandomArtPainter )
      // @Inject( PaintingModuleTypes.IRandomArtTaskEngine )
      // private readonly taskRepo: IRandomArtTaskEngine,
      // SHELVED: Seeding extension point
      // @Inject(SeedingModuleTypes.GMSeedExtensionPoint)
      // private readonly seedExtensionPoint: IGMSeedExtensionPoint,
      // @Inject(RANDOM_ART_LOCAL_CALLS_CHANNEL)
      // private readonly paintRequestChannel: IRxLocalCallChannel<
      //    PartialPaintRequest,
      //    PartialPaintResult
      // >,
      @Inject(QueuedPaintingTypes.FlowProducer)
      private readonly flowProducer: RandomArtFlowProducer<object, object>,
   ) {}

   // SHELVED: useSeeder() method - depends on seeding extension system (moved to attic/)
   // public async useSeeder(): Promise<void> {
   //    const aPromise = new Promise<PaintableSeed>((resolve, reject) => {
   //       const phrase: IPhraseSeed = {
   //          seedKey: "PhraseSeed",
   //          phrase: "It went that way",
   //       }
   //       const retVal = this.seedExtensionPoint.toSeedModel(phrase)
   //       of(retVal).subscribe({
   //          next: (retVal: PaintableSeed | PromiseLike<PaintableSeed>) => {
   //             console.log(retVal)
   //             resolve(retVal)
   //             // return retVal
   //          },
   //       })
   //    })
   //    const aPaintableSeed = await aPromise
   //    const aJobSpec: ScatterGatherTask<
   //       StagedPaintRequest,
   //       PartialPaintRequest,
   //       PartialPaintResult,
   //       StagedPaintResult
   //    > = ScatterGatherTaskImpl.wrap<
   //       StagedPaintRequest,
   //       PartialPaintRequest,
   //       PartialPaintResult,
   //       StagedPaintResult
   //    >({
   //       seedModel: {
   //          seedType: TWO_PHRASE_SEED_MODEL_STRATEGY_STR,
   //          // phrase: "It went that way",
   //          prefix: "You don't really want to mess",
   //          suffix: "You don't really want to mess",
   //          engineVersion: 1,
   //          regionMapRef: CIDUtil.parseCID(
   //             // "bafyreigktmlsvsl7t4nbpwcc7qb56vsfgynokrvlyadqcdl7ixibkaacpm",
   //             // "bafyreigah33uysc2jhbjopmhmr5hezdpxbpndvlu5tvl2524bdbrdj2bzy",
   //             // "bafyreiexe6npphnaou2tz7jdbwtgh2wnfdbsnbti22smksport4sqr7bgu",
   //             // "bafyreidkwc4w3sxxlwxpru7a6ossdjir3p3rewdtuinko7rlfr7ogtfr3u",
   //             // "bafyreihluy6dahevakcbsrch4qecrarfqhtr3jxf464iavoalfesxroygq",
   //             "bafyreibtfvyutz3gs3xw7wuysvnpj2meaacvqg5lkzi3ylmx2liayktzt4",
   //          ),
   //       },
   //       stageToPath: "a/b/cc",
   //       pixelWidth: 512,
   //       pixelHeight: 512,
   //    })
   //    console.log(await this.flowProducer.launchIt(aJobSpec))
   // }

   public async fromKeys(): Promise<void> {
      setTimeout(() => {}, 60000 * 60 * 24 * 365 * 10)
   }

   public async dskds(): Promise<void> {
      const { publicKey } = generateKeyPairSync("ec", {
         namedCurve: "secp256k1", // Options
         publicKeyEncoding: {
            type: "spki",
            format: "der",
         },
         privateKeyEncoding: {
            type: "pkcs8",
            format: "der",
         },
      })
      // Convert public key to base64, then extract ASCII character slices
      const keyAsBase64 = publicKey.toString("base64")
      const prefixChars = keyAsBase64.slice(52, 68) // 16 printable ASCII chars
      const suffixChars = keyAsBase64.slice(72, 90) // 18 printable ASCII chars

      // Encode those ASCII strings as UTF-8 bytes, then base64-encode for transport
      const prefixBytes = Buffer.from(prefixChars, "utf8")
      const suffixBytes = Buffer.from(suffixChars, "utf8")

      // const aJobSpec: ScatterGatherTask<
      //    StagedPaintRequest,
      //    PartialPaintRequest,
      //    PartialPaintResult,
      //    StagedPaintResult
      // > = ScatterGatherTaskImpl.wrap<
      //    StagedPaintRequest,
      //    PartialPaintRequest,
      //    PartialPaintResult,
      //    StagedPaintResult
      // >({
      //    seedModel: {
      //       prefix: prefixBytes.toString("base64"),
      //       suffix: suffixBytes.toString("base64"),
      //       engineVersion: 1,
      //       regionMapRef: CIDUtil.parseCID(
      //          "bafyreibtfvyutz3gs3xw7wuysvnpj2meaacvqg5lkzi3ylmx2liayktzt4",
      //       ),
      //    },
      //    stageToPath:
      //       "a/b/" +
      //       prefixChars.replaceAll("/", "_").replaceAll("=", "") +
      //       "-" +
      //       suffixChars.replaceAll("/", "_").replaceAll("=", ""),
      //    pixelWidth: 512,
      //    pixelHeight: 512,
      // })
      // console.log(await this.flowProducer.launchIt(aJobSpec))
   }

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
      const modelCid: CID = await this.mapRepo.import(adapter.directBuilder())
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

   public async loadRepo(): Promise<void> {
      const kweje = [
         // "rdoc01",
         // "fdoc2",
         // "fdoc_big",
         // "fdoc",
         // "gdoc2",
         // "hdoc2",
         // "qdoc2",
         // "qdoc4",
         // "qdoc5",
         // "qdoc6",
         // "rdoc02",
         // "rdoc03",
         "tdoc001",
         "tdoc002",
         "tdoc003",
         "tdoc004",
      ]
         .map(async (regionName: string): Promise<void> => {
            const adapter: PBufRegionMap = this.regionMapFactory.adapt(
               "./" + regionName + ".proto",
            )
            const modelCid: CID = await this.mapRepo.import(
               adapter.directBuilder(),
            )
            console.log(regionName + " :: " + modelCid.toString())
         })
         .forEach((clue: Promise<void>): void => {
            clue
               .then((_: unknown): void => {})
               .catch((x: unknown): void => {
                  console.error(x)
               })
         })
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
         const prefix: Uint8Array = hashBuf.slice(0, 16)
         const suffix: Uint8Array = hashBuf.slice(16)
         const prefixStr = Buffer.from(prefix).toString("hex")
         const suffixStr = Buffer.from(suffix).toString("hex")
         const fileName = `./${prefixStr}_${suffixStr}.png`
         const genModel: GenModel = newPicture(prefix, suffix)
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
            const prefix: Uint8ClampedArray = Uint8ClampedArray.from(buf)
            buf = Buffer.from(task.suffix, "hex")
            const suffix: Uint8ClampedArray = Uint8ClampedArray.from(buf)
            return {
               taskMessage: JSON.stringify(task),
               genModel: newPicture(prefix, suffix),
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
         fs.readFileSync("ticketManifest.json").toString(),
      )
      return workList.map((task: { phrase: string }): Task => {
         // Hash the phrase with SHA-256 to get deterministic 32 bytes
         const hash = createHash("sha256").update(task.phrase).digest()
         // Split into two 16-byte seeds
         const prefix = hash.subarray(0, 16)
         const suffix = hash.subarray(16, 32)

         const fileName: string = hash
            .toString("base64")
            .replaceAll("/", "_")
            .replaceAll("=", "")

         return {
            taskMessage: JSON.stringify(task),
            genModel: newPicture(prefix, suffix),
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
      const pixelData = new Uint32Array(
         regionMap.pixelHeight * regionMap.pixelWidth,
      )
      const artist: GenModelArtist = new GenModelArtist(
         new GenJs6Model(genModel),
         pixelData,
         regionMap.pixelWidth,
         0,
         regionMap.pixelHeight,
      )
      await regionMap.directPlotter(artist, 0, regionMap.pixelHeight)
      const stream = fs.createWriteStream(fileName)
      const context = canvas.getContext("2d", {
         alpha: false,
         pixelFormat: "RGB24",
      })
      const imageData = context.getImageData(
         0,
         0,
         regionMap.pixelWidth,
         regionMap.pixelHeight,
      )
      imageData.data.set(pixelData, 0)
      context.putImageData(imageData, 0, 0)
      const persister: CanvasPersister = new CanvasPersister(canvas, stream)
      if (taskMessage !== "") {
         const sidecarFile = fileName.replace("png", "json")
         fs.writeFileSync(sidecarFile, taskMessage)
      }
      await persister.finish()
   }
}
