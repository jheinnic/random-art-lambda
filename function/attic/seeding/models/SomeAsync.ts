export type Async<T> = T | Promise<T>

export type SomeAsync<T> =
   | Async<T>
   | Iterable<Async<T>>
   | AsyncIterable<Async<T>>
   | Promise<Iterable<Async<T>>>

// --- Type Guard defined outside for reusability ---
export function isAnyIterable<U>(
   obj: any,
): obj is Iterable<U> | AsyncIterable<U> {
   return (
      obj != null &&
      (typeof obj[Symbol.iterator] === "function" ||
         typeof obj[Symbol.asyncIterator] === "function")
   )
}
// --- Helper to check for only synchronous iterable (still needed for Promise<Iterable<T>> check) ---
export async function delegateHandler<T>(
   targets: SomeAsync<T>,
   handler: (item: T) => void,
): Promise<void> {
   // 1. Await the top-level wrapper (targets)
   // If targets is AsyncIterable<T>, resolvedTarget IS AsyncIterable<T>
   const resolvedTarget = await targets

   // 2. Check if the resulting value is iterable (sync or async)
   if (isAnyIterable(resolvedTarget)) {
      // This block is entered if resolvedTarget is Iterable<T> OR AsyncIterable<T>

      // 3. Use the for await...of loop
      // This loop correctly processes:
      // - Iterable<T> (synchronously)
      // - AsyncIterable<T> (asynchronously)
      for await (const result of resolvedTarget) {
         handler(await result)
      }
   } else {
      // ... (handle single item)
      handler(resolvedTarget)
   }
}
