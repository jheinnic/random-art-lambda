import { Chan, chan, put, take } from "medium"
import { setTimeout } from "node:timers/promises"

class Remote {
   private readonly promise: Promise<number>
   private receiver: ((value: number) => void) | undefined

   constructor() {
      this.promise = new Promise((resolve, _reject) => {
         this.receiver = resolve
      })
   }

   async makeRequest(ch: Chan<number>): Promise<void> {
      const value: number = await this.promise
      await put(ch, value)
      console.log("Delivered ", value)
      const ackVal = await take(ch)
      console.log("Acknowledged ", ackVal)
   }

   acceptValue(value: number): void {
      if (this.receiver !== undefined) {
         this.receiver(value)
      }
   }
}

async function dependOnRemote(remote: Remote): Promise<void> {
   const syncBuf: Chan<number> = chan()
   void remote.makeRequest(syncBuf)
   const value: number | symbol = await take(syncBuf)
   console.log("Remote sent ", value)
   if (typeof value === "number") {
      await setTimeout(1, "Working")
      console.log("Finished work")
      await put(syncBuf, 0 - value)
   }
}

const rem = new Remote()
console.log("Depending on remote...")
const handle = dependOnRemote(rem)
console.log("Depended on remote...")
rem.acceptValue(23)
console.log("You said that 23...")

await handle

class RemoteTwo {
   private pending: Record<string, Chan<number>> = {}

   constructor() {}
}
