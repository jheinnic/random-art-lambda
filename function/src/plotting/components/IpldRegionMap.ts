import { DataBlock, RegionMap, DimensionCodings, RegionBoundaryFractions } from "../ipldmodel"
import { AbstractRegionMap } from "./AbstractRegionMap.js"
import { unblockify, rationalize } from "./RegionMapUtils.js"

export class IpldRegionMap extends AbstractRegionMap {
  private readonly rowList: number[]
  private readonly colList: number[]

  constructor (
    private readonly regionMap: RegionMap,
    private readonly paletteBlocks: DataBlock[],
    private readonly dataBlocks: DataBlock[]
  ) {
    super()
    const boundary: RegionBoundaryFractions = regionMap.regionBoundary
    const codings: DimensionCodings = regionMap.codings

    const rowsN = unblockify(dataBlocks, paletteBlocks, (x) => x.rowsN, codings.rowsN );
    const rowsD = unblockify(dataBlocks, paletteBlocks, (x) => x.rowsD, codings.rowsD );
    const colsN = unblockify(dataBlocks, paletteBlocks, (x) => x.colsN, codings.colsN );
    const colsD = unblockify(dataBlocks, paletteBlocks, (x) => x.colsD, codings.colsD );
    const leftOffset = ( boundary.leftN < 0 ) ? ( boundary.leftN / boundary.leftD ) : 0
    const bottomOffset = ( boundary.bottomN < 0 ) ? ( boundary.bottomN / boundary.bottomD ) : 0
    this.rowList = rationalize( { N: rowsN, D: rowsD }, leftOffset )
    this.colList = rationalize( { N: colsN, D: colsD }, bottomOffset )
    //logFractions("ipldFractionReads.dat", rows, cols, boundary)
  }

  public get columnOrderedXCoordinates(): number[] {
    return this.rowList
  }

  public get columnOrderedYCoordinates(): number[] {
    return this.colList
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
}
