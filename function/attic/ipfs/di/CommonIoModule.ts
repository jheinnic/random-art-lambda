import { Module } from "@nestjs/common"
import { CommonModuleTypes } from "./typez"
import { FileSourceReader } from "../components/FileSourceReader"
import { FileTransport } from "../components/FileTransport"
import { LruSource } from "../components/StreamReaderTransport"
import { ConfigurableModuleClass } from "./CommonIoModuleDefinition"

@Module({
  providers: [
  { useClass: FileSourceReader, provide: CommonModuleTypes.FileSourceReader },
  { useClass: FileTransport, provide: CommonModuleTypes.FileTransport },
  {
  useClass: StreamReaderTransport,
  provide: CommonModuleTypes.StreamReaderTransport
  }
  ],
  exports: [
  CommonModuleTypes.FileSourceReader,
  CommonModuleTypes.FileTransport,
  CommonModuleTypes.StreamReaderTransport
  ]
  })
export class CommonIoModule extends ConfigurableModuleClass {}
