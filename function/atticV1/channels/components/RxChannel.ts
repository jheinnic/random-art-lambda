// Direct Migration from Chan/medium to RxJS
// ==========================================

import { Subject, ReplaySubject, Observable, firstValueFrom } from "rxjs"
import { concatMap, takeUntil, take } from "rxjs/operators"
// import { Injectable, OnModuleDestroy } from "@nestjs/common"

// 1. Replace ChannelWrapper with RxChannel
// =========================================

/**
 * Drop-in replacement for your ChannelWrapper
 * Provides Chan-like semantics using RxJS
 */
export class RxChannel<T> {
   private readonly subject: Subject<T>
   private readonly destroy$ = new Subject<void>()

   constructor(bufferSize?: number) {
      // ReplaySubject gives us buffer-like behavior
      if (bufferSize !== undefined && bufferSize > 0) {
         this.subject = new ReplaySubject<T>(bufferSize)
      } else {
         this.subject = new Subject<T>()
      }
   }

   // Replaces: put(channel, value)
   put(value: T): void {
      this.subject.next(value)
   }

   // Replaces: take(channel)
   async take(): Promise<T | undefined> {
      return await firstValueFrom(
         this.subject.pipe(take(1), takeUntil(this.destroy$)),
      )
   }

   // Replaces: repeatTake(channel, handler, context)
   repeatTake<C>(
      handler: (value: T, context: C) => Promise<C | false>,
      context: C,
   ): Observable<T> {
      return this.subject.pipe(
         takeUntil(this.destroy$),
         concatMap(async (value) => {
            const result = await handler(value, context)
            if (result === false) {
               this.close()
            }
            return value
         }),
      )
   }

   // Replaces: close(channel)
   close(): void {
      this.destroy$.next()
      this.destroy$.complete()
      this.subject.complete()
   }

   // Get observable for more RxJS-native usage
   asObservable(): Observable<T> {
      return this.subject.asObservable().pipe(takeUntil(this.destroy$))
   }

   // For backward compatibility
   unwrap(): this {
      return this
   }
}
