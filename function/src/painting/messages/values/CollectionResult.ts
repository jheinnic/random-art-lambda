import type { JobDisposition } from "../../middleware/types/JobDisposition.js"

export interface CollectionResult<T> {
   results: Array<T | ErrorMarker | null>
   ignoreCounter: number
   errorCounter: number
}

export interface ErrorMarker {
   disposition: JobDisposition
   originalIndex: number
   error?: Error
   jobId: string
}
