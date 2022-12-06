import { IPixelPainter } from "./IPixelPainter.js"
import { IRandomArtTask } from "./IRandomArtTask.js"
import { RandomArtTaskRequest } from "./RandomArtTaskRequest.js"

export interface IRandomArtTaskEngine {
  beginTask: (spec: RandomArtTaskRequest) => Promise<IRandomArtTask>
}
