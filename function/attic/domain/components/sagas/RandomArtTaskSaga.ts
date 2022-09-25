import { IEvent } from "@nestjs/cqrs";
import { Subject, Observable } from "rxjs";
import { CreatedRandomArtTaskEvent } from "../../interface/events/CreatedRandomArtTaskEvent";

export class RandomArtTaskSaga {
    constructor(
        private readonly initialEvent: CreatedRandomArtTaskEvent,
        private readonly onBehaviorChange: Subject<NextBehavior>,
        private readonly eventsMulticast: Observable<IEvent>
    ) { }

}