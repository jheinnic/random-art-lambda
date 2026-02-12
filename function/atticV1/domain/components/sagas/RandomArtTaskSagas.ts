import { Injectable } from "@nestjs/common"
import { ICommand, IEvent, ofType, Saga } from "@nestjs/cqrs"
import { AsyncIterableX, from } from "@reactivex/ix-ts/asynciterable"
import { mergeMap, Observable, share } from "rxjs"

import { LaunchVehicleCommand } from "../../../../../.history/function/src/toy/ToyDomain_20220829105557"
import { CreatedRandomArtTaskEvent } from "../../interface/events/CreatedRandomArtTaskEvent.js"
import { IRandomTaskEvent } from "../../interface/events/IRandomArtTaskEvent.js"

@Injectable()
export class RandomArtTaskSagas {
  // private readonly activeSagas: RandomArtSagaActor[] = []
  // private readonly newSagas: Chan<RandomArtSagaActor> = chan()

  @Saga()
  dragonKilled (events$: Observable<IEvent>): Observable<ICommand> {
    const ongoing = events$.pipe(
      ofType(IRandomArtTaskEvent),
      share({
        resetOnError: false,
        resetOnComplete: false,
        resetOnRefCountZero: false
      })
    )
    return ongoing.pipe(
      ofType(CreatedRandomArtTaskEvent),
      mergeMap((event) => {
        const inbox: AsyncIterableX<IRandomArtTaskEvent> = from(ongoing)
        const actor = new RandomArtSagaActor(event, inbox)
        return actor.asCommands()
      })
    )
  }
}
/* groupBy<CreatedPaintRandomArtTaskEvent, string, RandomArtSagaActor>(
            (event: CreatedPaintRandomArtTaskEvent): string => event.jobId,
            {
                element: (event: CreatedPaintRandomArtTaskEvent): RandomArtSagaActor => {
                  return new RandomArtSagaActor(event);
                        // new CreatePaintRandomArtTaskCommand("1", Uint8Array.of(2), Uint8Array.of(3), "4", "5")
                },
                duration: (grouped: GroupedObservable<string, RandomArtSagaActor>) : Observable<any> => {
                  return endSignals.pipe(
                    filter(event => event.jobId == grouped.key)
                  )
                },
            } as GroupByOptionsWithElement<string, RandomArtSagaActor, CreatedPaintRandomArtTaskEvent>,
        ),
        concatMap( (groups, index) => {
            return groups.getCommands()
        }), */
// function createSagaStream(groups: GroupedObservable<string, Observable<Observable<ICommand>>>, events$: Observable<IEvent>): Observable<ICommand> {
// Need to create an initial new source from $events that searches for an event that will require responding
// with:
// -- A sequence of commands to be concat-mapped to the overall @Output
// -- A new source Observable to replace what produced the latest sequence source by SwitchMap
// -- There may need to be a Subject to handle the Emission of switch map triggers? = new EventEmitter<eventType>();
//
// let subject = new Subject().pipe(
// publish()
// );
// }
interface SagaState {
  myCid: string
  genModel?: GenModel
  plotModel?: IPlotModel
}

type ActorBehavior = (
  state: SagaState,
  event: IEvent,
  context: BehaviorContext
) => SagaState

interface BehaviorContext {
  nextBehavior: (behavior: ActorBehavior) => void
  sendCommand: (command: ICommand) => void
}

function initialBehavior (
  state: SagaState,
  event: IRandomTaskEvent,
  context: BehaviorContext
): SagaState {
  if (event.cid !== state.myCid) {
    return state
  }
  switch (event.type) {
    case "CreatedRandomArtTaskEvent": {
      break
    }
    case "SeededGenModelEvent": {
      state = {
        ...state,
        genModel: newPicture(event.prefixBits, event.suffixBits)
      }
      break
    }
    case "LinkedPlotMapEvent": {
      break
    }
  }
  if (state.plotModel !== undefined && state.genModel !== undefined) {
    context.nextBehavior(watchForCompletion)
    context.sendCommand( new LaunchVehicleCommand() );
  }
}

class RandomArtSagaActor {
  /* outerSubject: Subject<ICommand> = new Subject<ICommand>();
  behavior: BehaviorSubject<ICommand> = new BehaviorSubject<
    Observable<ICommand>
  >(); */
  commands: AsyncSink<ICommand> = new AsyncSync<ICommand>()
  state: SagaState = {}
  behavior: ActorBehavior
  context: BehaviorContext
  done: boolean = false

  constructor (
    private readonly initial: CreatedRandomArtTaskEvent,
    private readonly inbox: AsyncIterableX<IEvent>
  ) {
    this.context = {
      nextBehavior: (behavior: ActorBehavior): void => {
        this.behavior = behavior
      },
      sendCommand: (command: ICommand): void => {
        this.commands.write(command)
      },
      endSaga: (): void => {
        this.done = true
      }
    }
    this.behavior = initialBehavior
  }

  public asCommands (): AsyncIterableX<ICommand> {
    for (const event of this.inbox) {
      this.state = this.behavior(this.state, event, context)
    }
    return this.commands
  }
  /* public getCommands(): Observable<ICommand> {
    defer(() => {
      return merge(
        this.events$.pipe(
          ofType(CreatedPaintRandomArtTaskEvent, CreatedPaintRandomArtTaskEvent)
        )
      ).pipe(
        map((event) => {
          return of(
            new CreatePaintRandomArtTaskCommand(
              "1",
              Uint8Array.of(2),
              Uint8Array.of(3),
              "4",
              "5"
            )
          );
        })
      );
    }).subscribe(this.behavior);

    return this.outerSubject.asObservable();
  } */
}
