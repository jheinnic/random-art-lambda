import { EventEmitter } from "events"

export class TriggerBox<T> {
  private readonly _emitter: EventEmitter
  private readonly _promise: Promise<T>

  // constructor(@optional() readonly timeout: number = 10000) {
  constructor () {
    const timeout = 10000
    const emitter = new EventEmitter()
    this._emitter = emitter
    this._promise = new Promise<T>((resolve, reject) => {
      const handle: Timeout = setTimeout(reject, timeout)
      emitter.on("trigger", (item: T) => {
        clearTimeout(handle)
        resolve(item)
      })
      emitter.on("cancel", (error: any) => {
        clearTimeout(handle)
        reject(error)
      })
    })
    console.log("Initialized new TriggerBox")
  }

  // then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined): PromiseLike<TResult1 | TResult2> {
  // return this._promise.then(onfulfilled, onrejected);
  // }
  async defer (): Promise<T> {
    return await this._promise
  }

  trigger (item: T): boolean {
    return this._emitter.emit("trigger", item)
  }

  cancel (error: any): boolean {
    return this._emitter.emit("cancel", error)
  }
}
