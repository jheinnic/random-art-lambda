import { TermPairSourceType } from "./TermPairSourceType.js"

export interface AllPairsTermPairSource {
   termPairSourceType: TermPairSourceType.AllPairs

   termPairSourceIndex: number

   taskCount: number

   regionMapCount: number

   termPairCount: number

   sourceTrigramCount: number

   identityPairsIncluded: boolean
}
