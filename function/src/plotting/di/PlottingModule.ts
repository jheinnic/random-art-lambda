import { Module } from "@nestjs/common"
import { BaseBlockstore } from "blockstore-core"

import { IpfsModule } from "../../ipfs/di/IpfsModule.js"
import { SharedArtBlockstoreModule } from "../../ipfs/di/SharedArtBlockstoreModule.js"
import { IpfsModuleTypes, SharedArtBlockstoreModuleTypes } from "../../ipfs/di/typez.js"
import { IpldRegionMapRepository } from "../components/IpldRegionMapRepository.js"
import { IpldRegionMapSchemaDsl } from "../components/IpldRegionMapSchemaDsl.js"
import { PBufAdapter } from "../protobuf/PBufAdapter.js"
import { PBufRegionMapDecoder } from "../protobuf/PBufRegionMapDecoder.js"
import { PlottingModuleTypes } from "./typez.js"

@Module({
  imports: [SharedArtBlockstoreModule],
  providers: [
  {
  provide: PlottingModuleTypes.IpldRegionMapRepository,
  useClass: IpldRegionMapRepository
  },
  {
  provide: PlottingModuleTypes.IpldRegionMapSchemaDsl,
  useClass: IpldRegionMapSchemaDsl
  },
  {
  provide: PlottingModuleTypes.ProtoBufAdapter,
  useClass: PBufAdapter
  },
  { provide: PlottingModuleTypes.ImportedBlockStore, useExisting: SharedArtBlockstoreModuleTypes.SharedMapBlockstore }
  ],
  exports: [PlottingModuleTypes.IpldRegionMapRepository, PlottingModuleTypes.ProtoBufAdapter, PlottingModuleTypes.ImportedBlockStore]
  })
// eslint-disable-next-line @typescript-eslint/no-extraneous-class, @typescript-eslint/no-unused-vars
export class PlottingModule { }
