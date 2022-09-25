import { EventsHandler, IEventHandler } from "@nestjs/cqrs"
import { CreatedRandomArtTaskEvent } from "../../interface/events/CreatedRandomArtTaskEvent"
import { RandomArtTask } from "../models/RandomArtTask"
import { RandomArtTaskRepository } from "../models/RandomArtTaskRepository"

@EventsHandler(CreatedRandomArtTaskEvent)
export class CreatedRandomArtTaskEventHandler
implements IEventHandler<CreatedRandomArtTaskEvent> {
  constructor (private readonly repository: RandomArtTaskRepository) {}

  handle (event: CreatedRandomArtTaskEvent): void {
    // let task: RandomArtTask = this.repository.getById(event.id);
    const task: RandomArtTask = new RandomArtTask(event.id, {
      jobId: event.jobId,
      prefixBytes: Uint8Array.from(event.prefixBytes),
      suffixBytes: Uint8Array.from(event.suffixBytes),
      plotMapUri: event.plotMapUri,
      storagePlanUri: event.storagePlanUri
    })
    this.repository.save(task)
  }
}
