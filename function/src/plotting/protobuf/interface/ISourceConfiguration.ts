import { CID } from "multiformats"

export interface ISourceConfiguration {
   getBuffersByCid: () => Promise<Map<CID, Buffer>>
}
