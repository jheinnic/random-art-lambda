import {concatMap, delayWhen, tap, EMPTY, filter, finalize, from, interval, map, mergeMap, mergeScan, of, range, share, Subject, switchAll, switchScan, take, timer, windowCount, queueScheduler, observeOn} from 'rxjs';

of(1, 2, 3).pipe(
  concatMap(n => interval(10).pipe(
    take(Math.round(Math.random() * 10)),
    map(() => 'X'),
    tap({ complete: () => console.log(`Done with ${ n }`) })
  ))
)
.subscribe(console.log);

let timeSrc = interval(5, queueScheduler).pipe(
    share({
      resetOnError: false,
      resetOnComplete: false,
      resetOnRefCountZero: false,
    })
  );

const queue = [];
const delays=[5, 20, 10, 1, 12, 0, 18, 52];
const myTimeSrc = timeSrc; //.pipe(
    // windowCount(1),
    // finalize(openGate),
    // concatMap( (x) => x ),
// );
/*
function openGate() {
    const size = queue.length;
    const nextInQueue = queue.shift();
    // console.log(`About to open the gate for ${nextInQueue}.  Queue size changes from ${size} to ${queue.length}`);
    setTimeout(() => {
        // console.log(`Releasing ${nextInQueue}`)
        nextInQueue.next(size)
        nextInQueue.complete();
    }, 0);
}
*/
range(1, 10).pipe(
    observeOn(queueScheduler),
    delayWhen( (value: number, index: number) => timer(500 * value) ),
    observeOn(queueScheduler),
    switchScan((acc, value, index) => {
        // console.log(`<${acc}>; <${value}>`);
        if (value < 3) {
            return myTimeSrc.pipe(
                observeOn(queueScheduler),
                map((tick) => { return ((value + 1) * 10000) +tick; }),
                // tap({ next: () => {if (queue.length > 0) { openGate();} } }),
            );
        } else if (value < 7) {
            return myTimeSrc.pipe(
                observeOn(queueScheduler),
                delayWhen( (tick) => timer(delays[tick % 7], queueScheduler) ),
                observeOn(queueScheduler),
                map((tick) => { return ((value + 1) * 10000) +tick; }),
                // tap({ next: () => {if (queue.length > 0) { openGate();} } }),
            );
        } else {
            return myTimeSrc.pipe(
                observeOn(queueScheduler),
                filter( (tick) => {
                    if ((tick % 5) >= 3) {
                        return true;
                    } else {
                        // openGate();
                        return false;
                    }
                }),
                delayWhen( (tick) => timer(3 * (tick % 20), queueScheduler) ),
                observeOn(queueScheduler),
                map((tick) => { return ((value + 1) * 10000) +tick; }),
                // tap({ next: () => {if (queue.length > 0) { openGate();} } }),
            )
        }
    }, 0),
    take(1100)
).subscribe({
    next: (next) => { console.log(next); },
    error: (err) => {console.error(err); },
    complete: () => { console.log("Done"); }
});