import { SeedType } from "./SeedType.js"

export interface NestedBatch {
   readonly batchKey: "NestedBatch"
   readonly children: readonly NestedElement[]
}

export interface QualifiedSubTask {
   regionMaps?: string | string[]

   /**
    * This should resolve to:
    * -- Array<Array<string>> to specify a list of paths
    * -- Array<string> to specify a single path.
    */
   sendTo?: string

   children: NestedElement[]
}

export type NestedElement = QualifiedSubTask | SeedType
