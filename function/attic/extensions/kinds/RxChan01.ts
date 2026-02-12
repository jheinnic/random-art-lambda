import {
   interval,
   map,
   mergeMap,
   Observable,
   of,
   takeUntil,
   tap,
   timer,
} from "rxjs"

const signal1 = interval(1)
const signal2 = interval(1)
const signal3 = interval(1)
const signal4 = interval(1)
const signal5 = interval(1)
const signal = of(signal1, signal2, signal3, signal4, signal5).pipe(
   mergeMap((x, idx) => {
      return x.pipe(map((value) => `${idx}-${value}`))
   }),
)

signal
   .pipe(
      tap((value: string) => {
         console.log(`Tapping: ${value}`)
      }),
      mergeMap((value: string): Observable<string> => {
         const currentDate = new Date()
         const afterTwelveSeconds = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate(),
            currentDate.getHours(),
            currentDate.getMinutes(),
            currentDate.getSeconds() + 12,
         )

         // This could be any observable stream
         const source = interval(500)

         const result = source.pipe(
            map((innerSeq: number): string => {
               return `SourceIndex: ${value}, Inner Sequence: ${innerSeq}, From: ${currentDate.toTimeString()}`
            }),
            takeUntil<string>(timer(afterTwelveSeconds)),
         )
         return result
      }, 5),
   )
   .subscribe({
      next: (value: string) => {
         console.log(value)
      },
      error: (value: any) => {
         console.error(value)
      },
      complete: () => {
         console.log("Finished")
      },
   })
