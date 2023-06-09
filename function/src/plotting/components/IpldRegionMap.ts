import { DataBlock, RegionMap } from "../interface/index.js"
import { AbstractRegionMap } from "./AbstractRegionMap.js"
import { hydrate, rationalize } from "./RegionMapUtils.js"

export class IpldRegionMap extends AbstractRegionMap {
  private readonly rowList: number[]
  private readonly colList: number[]

  constructor (private readonly regionMap: RegionMap, private readonly dataBlocks: DataBlock[]) {
    super()
    const boundary = regionMap.regionBoundary

    const rowNBytes = Buffer.concat(dataBlocks.map((dataBlock) => dataBlock.rowsN))
    const rowNMap = regionMap.rowsN
    const rowNPalette = hydrate(rowNMap.palette, [], rowNMap.baseWordLen)
    const rowN = hydrate(rowNBytes, rowNPalette, rowNMap.paletteWordLen)

    const rowDBytes = Buffer.concat(dataBlocks.map((dataBlock) => dataBlock.rowsD))
    const rowDMap = regionMap.rowsD
    const rowDPalette = hydrate(rowDMap.palette, [], rowDMap.baseWordLen)
    const rowD = hydrate(rowDBytes, rowDPalette, rowDMap.paletteWordLen)

    const leftOffset = (boundary.leftN < 0) ? (boundary.leftN / boundary.leftD) : 0
    this.rowList = rationalize({ N: rowN, D: rowD }, leftOffset)

    const colNBytes = Buffer.concat(dataBlocks.map((dataBlock) => dataBlock.colsN))
    const colNPalette = hydrate(regionMap.colsN.palette, [], regionMap.colsN.baseWordLen)
    const colN = hydrate(colNBytes, colNPalette, regionMap.colsN.paletteWordLen)

    const colDBytes = Buffer.concat(dataBlocks.map((dataBlock) => dataBlock.colsD))
    const colDPalette = hydrate(regionMap.colsD.palette, [], regionMap.colsD.baseWordLen)
    const colD = hydrate(colDBytes, colDPalette, regionMap.colsD.paletteWordLen)
    // logFractions("ipldFractionReads.dat", rows, cols, regionMap.regionBoundary)
    const bottomOffset = (boundary.bottomN < 0) ? (boundary.bottomN / boundary.bottomD) : 0
    this.colList = rationalize({ N: colN, D: colD }, bottomOffset)
  }

  public get columnOrderedXCoordinates (): number[] {
    return this.rowList
  }

  public get columnOrderedYCoordinates (): number[] {
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
