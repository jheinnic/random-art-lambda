import { IPlotModel } from "./IPlotModel"

export interface IRegionMapDecoder {
  provide: (modelData: Uint8Array) => Promise<IPlotModel>
}
