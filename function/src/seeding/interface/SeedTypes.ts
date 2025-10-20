export interface PrefixSuffix {
   type: "PrefixSuffix"
   prefix: Uint8Array
   suffix: Uint8Array
}

export interface SinglePhrase {
   type: "SinglePhrase"
   phrase: string
}

export interface PhrasePair {
   type: "PhrasePair"
   prefix: string
   suffix: string
}

export type SeedType = PrefixSuffix | SinglePhrase | PhrasePair

export type ReturnableSeedType =
   | SeedType
   | Promise<SeedType>
   | Iterable<SeedType>
   | AsyncIterable<SeedType>
