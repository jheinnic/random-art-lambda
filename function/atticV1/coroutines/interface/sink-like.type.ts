import { AsyncSink } from "ix"
import { Subject } from "rxjs"
import { IDirector } from "../../interface/index.js"

export type SinkLike<T> = Subject<T> | AsyncSink<T> | IDirector<T>

// export function isChan<T>(sink: SinkLike<T>): sink is Chan<T> {
//    return sink.hasOwnProperty('xduce') && sink.hasOwnProperty('isClosed');
// }

export function isSubject<T>(sink: SinkLike<T>): sink is Subject<T> {
   return sink instanceof Subject
}

export function isQueue<T>(sink: SinkLike<T>): sink is AsyncSink<T> {
   return sink instanceof AsyncSink
}

export function isDirector<T>(sink: SinkLike<T>): sink is IDirector<T> {
   return sink instanceof Function
}

export function callSink<T>(sink: SinkLike<T>, arg: T): void {
   if (isQueue(sink)) {
      sink.write(arg)
   } else if (isSubject(sink)) {
      sink.next(arg)
   } else {
      sink(arg)
   }
}

export function asFunction<T>(sink: SinkLike<T>): IDirector<T> {
   let retVal: (arg: T) => void

   if (isQueue(sink)) {
      retVal = function (arg: T): void {
         sink.write(arg)
      }
   } else if (isSubject(sink)) {
      retVal = function (arg: T): void {
         sink.next(arg)
      }
   } else {
      retVal = sink
   }

   return retVal
}
