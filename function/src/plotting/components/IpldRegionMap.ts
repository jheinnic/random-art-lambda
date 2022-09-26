import { AbstractRegionMap } from "../../painting/components/AbstractRegionMap.js"
import { DataBlock, hydrate, logFractions, rationalize, RegionMap } from "./IpldSchemaTypes.js"

export class IpldRegionMap extends AbstractRegionMap {
  private readonly rowList: number[]
  private readonly colList: number[]

  constructor (private readonly regionMap: RegionMap, private readonly dataBlocks: DataBlock[]) {
    super()
    const rowNBytes = Buffer.concat(dataBlocks.map((dataBlock) => dataBlock.rowsN))
    const rowDBytes = Buffer.concat(dataBlocks.map((dataBlock) => dataBlock.rowsD))
    const colNBytes = Buffer.concat(dataBlocks.map((dataBlock) => dataBlock.colsN))
    const colDBytes = Buffer.concat(dataBlocks.map((dataBlock) => dataBlock.colsD))

    try {
      const rowNPalette = hydrate(regionMap.rowsN.palette, [], regionMap.rowsN.baseWordLen)
      console.log("1h")
      const rowN = hydrate(rowNBytes, rowNPalette, regionMap.rowsN.paletteWordLen)
      console.log("2h")
      const rowDPalette = hydrate(regionMap.rowsD.palette, [], regionMap.rowsD.baseWordLen)
      console.log("3h")
      const rowD = hydrate(rowDBytes, rowDPalette, regionMap.rowsD.paletteWordLen)
      console.log("4h")
      const colNPalette = hydrate(regionMap.colsN.palette, [], regionMap.colsN.baseWordLen)
      console.log("5h")
      const colN = hydrate(colNBytes, colNPalette, regionMap.colsN.paletteWordLen)
      console.log("6h")
      const colDPalette = hydrate(regionMap.colsD.palette, [], regionMap.colsD.baseWordLen)
      console.log("7h")
      const colD = hydrate(colDBytes, colDPalette, regionMap.colsD.paletteWordLen)
      console.log("8h")
      const rows = { N: rowN, D: rowD }
      const cols = { N: colN, D: colD }
      // logFractions("ipldFractionReads.dat", rows, cols, regionMap.regionBoundary)
      console.log("ah")
      let leftOffset = 0
      if (regionMap.regionBoundary.leftN < 0) {
        leftOffset = regionMap.regionBoundary.leftN / regionMap.regionBoundary.leftD
      }
      this.rowList = rationalize(rows, leftOffset)
      console.log("ih")
      let bottomOffset = 0
      if (regionMap.regionBoundary.bottomN < 0) {
        bottomOffset = regionMap.regionBoundary.bottomN / regionMap.regionBoundary.bottomD
      }
      this.colList = rationalize(cols, bottomOffset)
      console.log("oh")
    } catch (error: any) {
      console.error("uh", error)
    }
  }

  public get regionRows (): number[] {
    return this.rowList
  }

  public get regionColumns (): number[] {
    return this.colList
  }

  public get pixelHeight (): number {
    return this.regionMap.imageSize.pixelHeight
  }

  public get pixelWidth (): number {
    return this.regionMap.imageSize.pixelWidth
  }

  public get isUniform (): boolean {
    return this.regionMap.projected
  }
}
