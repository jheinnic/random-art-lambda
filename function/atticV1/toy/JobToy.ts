import { setTimeout } from "node:timers/promises"
import {
   groupBy,
   map,
   mergeMap,
   Observable,
   reduce,
   scan,
   scheduled,
   asyncScheduler,
   share,
   Subject,
   tap,
   asapScheduler,
} from "rxjs"

interface Input {
   id: number
   data: string
}

interface CountingInput extends Input {
   count: number
}

const source = new Subject<Input>()
const sideCar: Observable<CountingInput> = scheduled(
   source.pipe(
      tap((value: Input): void => {
         console.log("ProcessingA: ", value)
      }),
      share({ resetOnComplete: false }),
      tap((value: Input): void => {
         console.log("ProcessingB: ", value)
      }),
      scan<Input, CountingInput>(
         (_acc: CountingInput, value, index) => {
            return { ...value, count: index + 1 }
         },
         { id: 0, data: "", count: 0 },
      ),
      share({ resetOnRefCountZero: false }),
   ),
   asyncScheduler,
)
const worker: Observable<string> = sideCar.pipe(
   tap((value) => console.log("Worker sees ", value)),
   groupBy((value: CountingInput): number => value.id, {}),
   mergeMap((group: Observable<CountingInput>) => {
      return group.pipe(
         reduce((acc: string[], input: CountingInput) => {
            const rpt = new Array(input.count)
            rpt.fill(input.data)
            return [...acc, ...rpt]
         }, []),
      )
   }),
   map((datum: string[]): string => datum.join(", ")),
)

const sub1 = worker.subscribe({
   next: (value: string): void => {
      console.log("x", value)
   },
   complete: (): void => {
      console.log("All Gone")
   },
})

const foo = setTimeout(0, "bang")
await foo
console.log(foo)
source.next({
   id: 1,
   data: "One",
})
console.log("1")
source.next({
   id: 2,
   data: "Two",
})
console.log("2")
source.next({
   id: 3,
   data: "Three",
})
console.log("3")

const sub2 = sideCar.subscribe({
   next: (value: CountingInput): void => {
      console.log("y", value)
   },
   complete: (): void => {
      console.log("All Counted")
   },
})
await setTimeout(1, "what")

source.next({
   id: 1,
   data: "OneB",
})
source.next({
   id: 2,
   data: "TwoB",
})
source.next({
   id: 3,
   data: "ThreeB",
})
source.complete()

sub1.add((): void => {
   console.log("Unsubscribed")
})
await setTimeout(1, "what")
sub1.unsubscribe()

source.next({
   id: 1,
   data: "OneC",
})

// await setTimeout(1, "bong")
// sub2.unsubscribe()
const sub3 = worker.subscribe({
   next: (value: string): void => {
      console.log("z", value)
   },
   complete: (): void => {
      console.log("All Gone")
   },
})
await setTimeout(1, "bong")
// sub2.unsubscribe()

source.next({
   id: 2,
   data: "TwoC",
})
source.next({
   id: 3,
   data: "ThreeC",
})

// await setTimeout(1, "abc")
source.complete()
