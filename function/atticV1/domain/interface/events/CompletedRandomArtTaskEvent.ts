import { IRandomArtTaskEvent } from "./IRandomArtTaskEvent"

export class CompletedRandomArtTaskEvent implements IRandomArtTaskEvent {
  constructor (public readonly cid: string, public readonly jobId: string) {}
}
