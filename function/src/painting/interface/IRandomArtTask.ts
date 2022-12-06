import { Canvas } from "canvas"

import { IRandomArtwork } from "./IRandomArtwork.js"
import { RandomArtTaskRequest } from "./RandomArtTaskRequest.js"

export interface IRandomArtTask {
  readonly spec: RandomArtTaskRequest
  done: boolean
  readonly artwork: Promise<IRandomArtwork>
}
