import { AbstractRegionMap } from "../../painting/components/AbstractRegionMap.js"
import { PointPlotData } from "./plot_mapping_pb"

export class PBufRegionMap extends AbstractRegionMap {
  constructor (private readonly _data: PointPlotData) {
    super()
  }

  public get regionRows (): number[] {
    return this._data.getRowsList()
  }

  public get regionColumns (): number[] {
    return this._data.getColumnsList()
  }

  public get pixelHeight (): number {
    const data = this._data.getResolution()
    if (data === undefined && !this._data.getUniform()) {
      throw new Error("Image resolution must be defined")
    }
    return data?.getPixelheight() ?? this._data.getRowsList().length
  }

  public get pixelWidth (): number {
    const data = this._data.getResolution()
    if (data === undefined && !this._data.getUniform()) {
      throw new Error("Image resolution must be defined")
    }
    return data?.getPixelwidth() ?? this._data.getColumnsList().length
  }

  public get isUniform (): boolean {
    return this._data.getUniform()
  }
}