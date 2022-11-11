// package: plot_mapping.v1
import * as jspb from "google-protobuf"

// file: protobuf/plot_mapping.proto
export class RegionBoundary extends jspb.Message {
  getTop (): number
  setTop (value: number): void

  getLeft (): number
  setLeft (value: number): void

  getBottom (): number
  setBottom (value: number): void

  getRight (): number
  setRight (value: number): void

  serializeBinary (): Uint8Array
  toObject (includeInstance?: boolean): RegionBoundary.AsObject
  static toObject (includeInstance: boolean, msg: RegionBoundary): RegionBoundary.AsObject
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>}
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>}
  static serializeBinaryToWriter (message: RegionBoundary, writer: jspb.BinaryWriter): void
  static deserializeBinary (bytes: Uint8Array): RegionBoundary
  static deserializeBinaryFromReader (message: RegionBoundary, reader: jspb.BinaryReader): RegionBoundary
}

export namespace RegionBoundary {
  export interface AsObject {
    top: number
    left: number
    bottom: number
    right: number
  }
}

export class ImageSize extends jspb.Message {
  getPixelheight (): number
  setPixelheight (value: number): void

  getPixelwidth (): number
  setPixelwidth (value: number): void

  serializeBinary (): Uint8Array
  toObject (includeInstance?: boolean): ImageSize.AsObject
  static toObject (includeInstance: boolean, msg: ImageSize): ImageSize.AsObject
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>}
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>}
  static serializeBinaryToWriter (message: ImageSize, writer: jspb.BinaryWriter): void
  static deserializeBinary (bytes: Uint8Array): ImageSize
  static deserializeBinaryFromReader (message: ImageSize, reader: jspb.BinaryReader): ImageSize
}

export namespace ImageSize {
  export interface AsObject {
    pixelheight: number
    pixelwidth: number
  }
}

export class PointPlotData extends jspb.Message {
  getPixelref (): RefPointMap[keyof RefPointMap]
  setPixelref (value: RefPointMap[keyof RefPointMap]): void

  hasResolution (): boolean
  clearResolution (): void
  getResolution (): ImageSize | undefined
  setResolution (value?: ImageSize): void

  hasMappedRegion (): boolean
  clearMappedRegion (): void
  getMappedRegion (): RegionBoundary | undefined
  setMappedRegion (value?: RegionBoundary): void

  getUniform (): boolean
  setUniform (value: boolean): void

  clearRowsList (): void
  getRowsList (): number[]
  setRowsList (value: number[]): void
  addRows (value: number, index?: number): number

  clearColumnsList (): void
  getColumnsList (): number[]
  setColumnsList (value: number[]): void
  addColumns (value: number, index?: number): number

  serializeBinary (): Uint8Array
  toObject (includeInstance?: boolean): PointPlotData.AsObject
  static toObject (includeInstance: boolean, msg: PointPlotData): PointPlotData.AsObject
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>}
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>}
  static serializeBinaryToWriter (message: PointPlotData, writer: jspb.BinaryWriter): void
  static deserializeBinary (bytes: Uint8Array): PointPlotData
  static deserializeBinaryFromReader (message: PointPlotData, reader: jspb.BinaryReader): PointPlotData
}

export namespace PointPlotData {
  export interface AsObject {
    pixelref: RefPointMap[keyof RefPointMap]
    resolution?: ImageSize.AsObject
    mappedRegion?: RegionBoundary.AsObject
    uniform: boolean
    rowsList: number[]
    columnsList: number[]
  }
}

export class PointPlotMeta extends jspb.Message {
  getUlid (): string
  setUlid (value: string): void

  getPath (): string
  setPath (value: string): void

  getCreatetime (): number
  setCreatetime (value: number): void

  hasOrigin (): boolean
  clearOrigin (): void
  getOrigin (): BuildId | undefined
  setOrigin (value?: BuildId): void

  serializeBinary (): Uint8Array
  toObject (includeInstance?: boolean): PointPlotMeta.AsObject
  static toObject (includeInstance: boolean, msg: PointPlotMeta): PointPlotMeta.AsObject
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>}
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>}
  static serializeBinaryToWriter (message: PointPlotMeta, writer: jspb.BinaryWriter): void
  static deserializeBinary (bytes: Uint8Array): PointPlotMeta
  static deserializeBinaryFromReader (message: PointPlotMeta, reader: jspb.BinaryReader): PointPlotMeta
}

export namespace PointPlotMeta {
  export interface AsObject {
    ulid: string
    path: string
    createtime: number
    origin?: BuildId.AsObject
  }
}

export class BuildId extends jspb.Message {
  getSourcename (): string
  setSourcename (value: string): void

  getSourceurl (): string
  setSourceurl (value: string): void

  getSourceref (): string
  setSourceref (value: string): void

  getVersion (): string
  setVersion (value: string): void

  getBuild (): string
  setBuild (value: string): void

  serializeBinary (): Uint8Array
  toObject (includeInstance?: boolean): BuildId.AsObject
  static toObject (includeInstance: boolean, msg: BuildId): BuildId.AsObject
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>}
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>}
  static serializeBinaryToWriter (message: BuildId, writer: jspb.BinaryWriter): void
  static deserializeBinary (bytes: Uint8Array): BuildId
  static deserializeBinaryFromReader (message: BuildId, reader: jspb.BinaryReader): BuildId
}

export namespace BuildId {
  export interface AsObject {
    sourcename: string
    sourceurl: string
    sourceref: string
    version: string
    build: string
  }
}

export class PointPlotDocument extends jspb.Message {
  hasMeta (): boolean
  clearMeta (): void
  getMeta (): PointPlotMeta | undefined
  setMeta (value?: PointPlotMeta): void

  hasData (): boolean
  clearData (): void
  getData (): PointPlotData | undefined
  setData (value?: PointPlotData): void

  serializeBinary (): Uint8Array
  toObject (includeInstance?: boolean): PointPlotDocument.AsObject
  static toObject (includeInstance: boolean, msg: PointPlotDocument): PointPlotDocument.AsObject
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>}
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>}
  static serializeBinaryToWriter (message: PointPlotDocument, writer: jspb.BinaryWriter): void
  static deserializeBinary (bytes: Uint8Array): PointPlotDocument
  static deserializeBinaryFromReader (message: PointPlotDocument, reader: jspb.BinaryReader): PointPlotDocument
}

export namespace PointPlotDocument {
  export interface AsObject {
    meta?: PointPlotMeta.AsObject
    data?: PointPlotData.AsObject
  }
}

export interface RefPointMap {
  TOP_LEFT: 0
  CENTER: 1
}

export const RefPoint: RefPointMap
