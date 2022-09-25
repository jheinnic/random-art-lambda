import { BitInputStream } from "@thi.ng/bitstream"
import * as mathjs from "mathjs"

import { AbstractRegionMap } from "../../painting/components/AbstractRegionMap.js"
import { DataBlock, RegionMap } from "./IpldSchemaTypes.js"

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
      console.log("ah")
      this.rowList = rationalize({ N: rowN, D: rowD })
      console.log("ih")
      this.colList = rationalize({ N: colN, D: colD })
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

function hydrate (bytes: Buffer, palette: number[], wordSize: number): number[] {
  if (bytes.length <= 0) {
    return []
  }
  const reader = new BitInputStream(bytes)
  let unpacked = reader.readWords(Math.floor(8 * bytes.length / wordSize), wordSize)
  if (palette.length > 0) {
    unpacked = unpacked.map((x) => palette[x])
  }
  return unpacked
}

function rationalize (fractions: Fractions): number[] {
  const len = fractions.N.length
  const retval = new Array<number>(len)
  let idx = 0
  for (idx = 0; idx < len; idx++) {
    if (fractions.N[idx] === 0) {
      console.log(idx, fractions.D[idx], fractions.N[idx])
      retval[idx] = mathjs.fraction(fractions.D[idx], 1)
    } else {
      retval[idx] = mathjs.fraction(fractions.D[idx], fractions.N[idx])
    }
  }
  return retval
}
