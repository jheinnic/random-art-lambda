import "@reactivex/ix-ts/add/asynciterable-operators/reduce"

import { AsyncIterableX } from "@reactivex/ix-ts/asynciterable"

export async function concatAll (source: AsyncIterableX<Uint8Array>): Promise<Uint8Array> {
  const size = await source.reduce(
    {
      seed: 0,
      callback: (sum: number, x: Uint8Array) => {
        return sum + x.length
      }
    }
  )

  // Create a new array with total length and merge all source arrays.
  const mergedArray = new Uint8Array(size)
  let offset = 0
  for await (const item of source) {
    mergedArray.set(item, offset)
    offset = offset + item.length
  }
  return mergedArray
}
