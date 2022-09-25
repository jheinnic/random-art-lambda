import {CommandBus, QueryBus } from '@nestjs/cqrs';
import {instanceToInstance, plainToInstance} from 'class-transformer';
import { CreateRandomArtTaskCommand } from '../../app/interface/commands/CreateRandomArtTaskCommand';
import { RandomArtPaintTask } from '../../app/interface/dto/RandomArtPaintTask';
import { LambdaSQSEvent } from "../../aws/interface/LambdaEvent";

export class LambdaSqsAdapter {
    constructor( private readonly commandBus: CommandBus) { }

    lambda_handler(event: LambdaSQSEvent, context: any, callback: (reply: unknown) => void) {
        console.log('Received event:', JSON.stringify(event, null, 4));
        for (let message of event.Records) {
            console.log('Message received from SQS:', message)
            const parsedBody: object = JSON.parse(message.body)
            const messageBody: RandomArtPaintTask = plainToInstance(RandomArtPaintTask, parsedBody)
            const command: CreateRandomArtTaskCommand = instanceToInstance<CreateRandomArtTaskCommand>(messageBody)
            this.commandBus.execute(command)
        }

        callback({
            "batchIdFailures": [ ]
        });
    }
}