import {
   DataBlock,
   RegionMap,
   RefPoint,
   DimensionCodings,
   RegionBoundaryFractions,
} from "../ipldmodel"
import { AbstractRegionMap } from "../../components/AbstractRegionMap.js"
import { unblockify, rationalize } from "./RegionMapUtils.js"
import { IRegionMapBuilder } from "../../interface/IRegionMapBuilder.js"

export class IpldRegionMap extends AbstractRegionMap {
   private readonly rowList: readonly number[]
   private readonly colList: readonly number[]
   private readonly pixelRef: RefPoint
   constructor(
      private readonly regionMap: RegionMap,
      private readonly paletteBlocks: readonly DataBlock[],
      private readonly dataBlocks: readonly DataBlock[],
   ) {
      super()
      const boundary: RegionBoundaryFractions = regionMap.regionBoundary
      const codings: DimensionCodings = regionMap.codings

      const rowsN = unblockify(
         dataBlocks,
         paletteBlocks,
         (x) => x.rowsN,
         codings.rowsN,
      )
      const rowsD = unblockify(
         dataBlocks,
         paletteBlocks,
         (x) => x.rowsD,
         codings.rowsD,
      )
      const colsN = unblockify(
         dataBlocks,
         paletteBlocks,
         (x) => x.colsN,
         codings.colsN,
      )
      const colsD = unblockify(
         dataBlocks,
         paletteBlocks,
         (x) => x.colsD,
         codings.colsD,
      )
      const leftOffset = boundary.leftN / boundary.leftD
      const bottomOffset = boundary.bottomN / boundary.bottomD
      this.rowList = rationalize({ N: rowsN, D: rowsD }, leftOffset)
      this.colList = rationalize({ N: colsN, D: colsD }, bottomOffset)
      this.pixelRef = regionMap.pixelRef
      // logFractions("ipldFractionReads.dat", rows, cols, boundary)
   }

   public get columnOrderedXCoordinates(): readonly number[] {
      return [...this.rowList]
   }

   public get columnOrderedYCoordinates(): readonly number[] {
      return [...this.colList]
   }

   public get pixelHeight(): number {
      return this.regionMap.imageSize.pixelHeight
   }

   public get pixelWidth(): number {
      return this.regionMap.imageSize.pixelWidth
   }

   public get isUniform(): boolean {
      return this.regionMap.projected
   }

   public directBuilder(): (builder: IRegionMapBuilder) => void {
      return (builder: IRegionMapBuilder) => {
         builder
            .pixelRef(this.pixelRef)
            .imageSize(this.pixelWidth, this.pixelHeight)
            .regionBoundary(this.regionMap.regionBoundary)
            .xByRows(this.rowList)
            .yByRows(this.colList)
      }
   }
}
