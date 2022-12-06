import { EventsHandler, IEventHandler } from "@nestjs/cqrs"

import { CreatedRandomArtTaskEvent } from "../../interface/events/CreatedRandomArtTaskEvent"
import { RandomArtTaskRequest } from "../models/RandomArtTaskRequest"
import { RandomArtworkRepository } from "../models/RandomArtworkRepository"

@EventsHandler(CreatedRandomArtTaskEvent)
export class CreatedRandomArtTaskEventHandler
implements IEventHandler<CreatedRandomArtTaskEvent> {
  constructor (private readonly repository: RandomArtworkRepository) {}

  handle (event: CreatedRandomArtTaskEvent): void {
    // let task: RandomArtTaskRequest = this.repository.getById(event.id);
    const task: RandomArtTaskRequest = new RandomArtTaskRequest(event.id, {
      jobId: event.jobId,
      prefixBytes: Uint8Array.from(event.prefixBytes),
      suffixBytes: Uint8Array.from(event.suffixBytes),
      plotMapUri: event.plotMapUri,
      storagePlanUri: event.storagePlanUri
    })
    this.repository.save(task)
  }
}
