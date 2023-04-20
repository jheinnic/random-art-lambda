import { IRandomArtwork } from "./IRandomArtwork.js"
import { RandomArtTaskRequest } from "./RandomArtTaskRequest.js"

export interface IRandomArtTaskEngine {
  beginTask: (spec: RandomArtTaskRequest) => Promise<IRandomArtwork>
}
