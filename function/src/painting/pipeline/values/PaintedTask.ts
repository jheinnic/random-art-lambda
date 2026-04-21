import { IRegionMap } from "../../../plotting/index.js"
import {
   PrefixData,
   SuffixData,
} from "../../messages/values/PaintingNamedValues.js"
import { PaintTaskId } from "../../messages/values/PaintTaskId.js"

export interface PaintedTask {
   taskId: PaintTaskId

   seedPrefix: PrefixData

   seedSuffix: SuffixData

   regionMapName: string

   regionMap: IRegionMap

   pngData: Buffer

   pixelWidth: number

   pixelHeight: number

   pixelSize: number
   // startTime: number

   endTime: number
}
