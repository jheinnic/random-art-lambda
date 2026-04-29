import type { IFileStore } from "../../../storage/index.js"

/** Virtual contract: the resolved file store to stage into. */

export interface FileStoreSelection {
   selected: IFileStore
}
