/**
 * File Storage Extension
 *
 * Augments PipelineContext with file storage operations.
 * Uses injected FileStore dependency (via Symbol - won't serialize).
 */

import { PipelineContext } from "../PipelineContext.js"
import { FILE_STORE } from "./symbols.js"

/**
 * File storage interface (injected dependency)
 */
export interface IFileStore {
   write(path: string, buffer: Buffer): Promise<void>
   read(path: string): Promise<Buffer>
   exists(path: string): Promise<boolean>
}

// Augment PipelineContext interface
declare module "../PipelineContext.js" {
   interface PipelineContext {
      /**
       * Write image to storage
       * Uses injected FileStore (Symbol property)
       */
      writeToStorage(): Promise<void>

      /**
       * Check if file exists in storage
       */
      existsInStorage(): Promise<boolean>
   }
}

// Add method implementations
PipelineContext.prototype.writeToStorage = async function () {
   const self = this as any
   const fileStore = self[FILE_STORE] as IFileStore | undefined

   if (!fileStore) {
      throw new Error("FileStore not injected - call injectFileStore() first")
   }

   // Use getFullPath() from naming extension
   const path = this.getFullPath()
   await fileStore.write(path, this.buffer)
}

PipelineContext.prototype.existsInStorage = async function () {
   const self = this as any
   const fileStore = self[FILE_STORE] as IFileStore | undefined

   if (!fileStore) {
      throw new Error("FileStore not injected - call injectFileStore() first")
   }

   const path = this.getFullPath()
   return await fileStore.exists(path)
}

/**
 * Inject FileStore dependency into context
 * Uses Symbol property - won't be serialized!
 */
export function injectFileStore(
   ctx: PipelineContext,
   fileStore: IFileStore,
): void {
   ;(ctx as any)[FILE_STORE] = fileStore
}
