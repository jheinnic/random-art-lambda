import { TermPairSourceType } from "./TermPairSourceType.js"

export interface PrefixSuffixTermPairSource {
   termPairSourceType: TermPairSourceType.PrefixSuffix

   termPairSourceIndex: number

   taskCount: number

   regionMapCount: number

   termPairCount: number

   prefixCount: number

   suffixCount: number
}
