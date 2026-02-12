import { IEvent } from "@nestjs/cqrs"
import { IRandomArtTaskEvent } from "./IRandomArtTaskEvent"

export class CreatedRandomArtTaskEvent implements IEvent {
  static readonly type = "CreatedRandomTaskEvent"

  constructor (public readonly cid: string) {}
}
