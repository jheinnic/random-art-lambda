// <reference path="./plot_mapping_pb.d.ts"/>
import { AbstractRegionMap } from "../../components/AbstractRegionMap.js"
import { IRegionMapBuilder } from "../../interface/IRegionMapBuilder.js"
import { PointPlotData } from "./plot_mapping_pb.js"

type PR = "Center" | "TopLeft"
const PIXEL_REF_MAP: PR[] = ["Center", "TopLeft"]

export class PBufRegionMap extends AbstractRegionMap {
   constructor(private readonly _data: PointPlotData) {
      super()
   }

   public get columnOrderedXCoordinates(): number[] {
      return this._data.getRowsList()
   }

   public get columnOrderedYCoordinates(): number[] {
      return this._data.getColumnsList()
   }

   public get pixelHeight(): number {
      const data = this._data.getResolution()
      if (data === undefined && !this._data.getUniform()) {
         throw new Error("Image resolution must be defined")
      }
      return data?.getPixelheight() ?? this._data.getRowsList().length
   }

   public get pixelWidth(): number {
      const data = this._data.getResolution()
      if (data === undefined && !this._data.getUniform()) {
         throw new Error("Image resolution must be defined")
      }
      return data?.getPixelwidth() ?? this._data.getColumnsList().length
   }

   public get isUniform(): boolean {
      return this._data.getUniform()
   }

   public directBuilder(): (builder: IRegionMapBuilder) => void {
      return (builder: IRegionMapBuilder) => {
         const mappedRegion = this._data.getMappedRegion()
         if (mappedRegion === undefined || mappedRegion === null) {
            throw new Error("Mapped region must be defined")
         }
         const pixelRef = this._data.getPixelref()
         builder
            .pixelRef(PIXEL_REF_MAP[pixelRef])
            .regionBoundary(mappedRegion.toObject())
            .imageSize(this.pixelWidth, this.pixelHeight)
            .xByRows(this.columnOrderedXCoordinates)
            .yByRows(this.columnOrderedYCoordinates)
      }
   }
}
