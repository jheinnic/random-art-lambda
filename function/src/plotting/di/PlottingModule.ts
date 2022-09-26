import { Module } from "@nestjs/common"
import { BaseBlockstore } from "blockstore-core"

import { IpfsModule } from "../../ipfs/di/IpfsModule.js"
import { IpfsModuleTypes } from "../../ipfs/di/typez.js"
import { IpldRegionMapRepository } from "../components/IpldRegionMapRepository.js"
import { IpldRegionMapSchemaDsl } from "../components/IpldRegionMapSchemaDsl.js"
import { PBufRegionMapDecoder } from "../protobuf/PBufRegionMapDecoder.js"
import { ProtobufAdapter } from "../protobuf/ProtobufAdapter.js"
import { PlottingModuleTypes } from "./typez.js"

@Module({
  imports: [
  IpfsModule.register({ rootPath: "/home/ionadmin/Documents/raBlocks", cacheSize: 500, injectToken: PlottingModuleTypes.ImportedBlockStore}),
  ],
  providers: [
  {
  provide: PlottingModuleTypes.PBufPlotRegionMapDecoder,
  useClass: PBufRegionMapDecoder
  },
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
  useClass: ProtobufAdapter
  },
  { provide: IpfsModuleTypes.AbstractBlockstore, useExisting: PlottingModuleTypes.ImportedBlockStore }
  ],
  exports: [PlottingModuleTypes.IpldRegionMapRepository, PlottingModuleTypes.ProtoBufAdapter, IpfsModuleTypes.AbstractBlockstore ]
  })
// eslint-disable-next-line @typescript-eslint/no-extraneous-class, @typescript-eslint/no-unused-vars
export class PlottingModule { }
