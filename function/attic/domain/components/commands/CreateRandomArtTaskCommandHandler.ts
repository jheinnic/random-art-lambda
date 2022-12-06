import { CommandHandler, EventPublisher, ICommandHandler } from "@nestjs/cqrs"

import { CreateRandomArtTaskCommand } from "../../interface/commands/CreateRandomArtTaskCommand"
import { RandomArtTaskRequest } from "../models/RandomArtTaskRequest"
import { RandomArtworkRepository } from "../models/RandomArtworkRepository"

@CommandHandler(CreateRandomArtTaskCommand)
export class CreateRandomArtTaskCommandHandler
implements ICommandHandler<CreateRandomArtTaskCommand> {
  constructor (private readonly repository: RandomArtworkRepository) {}

  async execute (command: CreateRandomArtTaskCommand): Promise<void> {
    const { prefixBytes, suffixBytes, plotMapCid } = command
    const taskModel = await this.repository.create(
      plotMapCid,
      prefixBytes,
      suffixBytes
    )
    taskModel.commit()
  }
}
