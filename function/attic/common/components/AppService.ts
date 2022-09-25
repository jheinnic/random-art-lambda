import { Injectable } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { CreateRandomArtTaskCommand } from "../interface/commands/CreateRandomArtTaskCommand";

@Injectable()
export class AppService {
    public constructor(private readonly commandBus: CommandBus) { }

    public testCommand() {
        let command = new CreateRandomArtTaskCommand( "Freddy", Uint8Array.of(84, 81, 81, 190), Uint8Array.of(182, 81, 143, 94, 88, 104), "idlp:/fooo", "idlp:/var");
        this.commandBus.execute(command);
        console.log("Finished execute!");
    }
}