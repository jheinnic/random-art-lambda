import { Inject, Injectable } from "@nestjs/common"
import { CID } from "multiformats"

import {
   IRegionMap,
   IRegionMapRepository,
   IRegionMapBuilder,
} from "../../interface/index.js"
import { PBufRegionMapFactory } from "./PBufRegionMapFactory.js"
import { ProtobufPlottingModuleTypes } from "../di/Types.js"
import { PBufSourceConfiguration } from "./PBufSourceConfiguration.js"

@Injectable()
export class PBufRegionMapRepository implements IRegionMapRepository {
   private regionMapBuffers?: Map<CID, Buffer | IRegionMap> = undefined

   constructor(
      private readonly pbRegionMapFactory: PBufRegionMapFactory,
      private readonly sourceConfig: PBufSourceConfiguration,
   ) {}

   async import(_director: (builder: IRegionMapBuilder) => void): Promise<CID> {
      throw new Error("Method not implemented.")
   }

   async load(cid: CID): Promise<IRegionMap> {
      if (this.regionMapBuffers === undefined) {
         this.regionMapBuffers = new Map<CID, Buffer | IRegionMap>(
            await this.sourceConfig.getBuffersByCid(),
         )
      }

      let regionMapMaybe: Buffer | IRegionMap | undefined =
         this.regionMapBuffers.get(cid)
      if (regionMapMaybe === undefined) {
         throw new Error(`Region map not found for CID: ${cid.toString()}`)
      }
      if (regionMapMaybe instanceof Buffer) {
         // Why isn't Typescript narrowing correctly here!
         regionMapMaybe = this.pbRegionMapFactory.adapt(regionMapMaybe)
         this.regionMapBuffers.set(cid, regionMapMaybe)
      }

      return regionMapMaybe as unknown as IRegionMap
   }
}
