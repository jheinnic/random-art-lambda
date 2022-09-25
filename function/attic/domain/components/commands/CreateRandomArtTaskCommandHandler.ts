import { CommandHandler, ICommandHandler, EventPublisher } from "@nestjs/cqrs"
import { CreateRandomArtTaskCommand } from "../../interface/commands/CreateRandomArtTaskCommand"
import { RandomArtTask } from "../models/RandomArtTask"
import { RandomArtTaskRepository } from "../models/RandomArtTaskRepository"

@CommandHandler(CreateRandomArtTaskCommand)
export class CreateRandomArtTaskCommandHandler
implements ICommandHandler<CreateRandomArtTaskCommand> {
  constructor (private readonly repository: RandomArtTaskRepository) {}

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
