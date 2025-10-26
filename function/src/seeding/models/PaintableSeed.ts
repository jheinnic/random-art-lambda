import {
   PAINTABLE_PHRASE_PAIR,
   PAINTABLE_PREFIX_SUFFIX,
   PAINTABLE_SINGLE_PHRASE,
} from "./../kinds/Constants.js"
import { SeedType } from "./SeedType.js"

export interface PrefixSuffix extends SeedType {
   readonly seedKey: PAINTABLE_PREFIX_SUFFIX
   readonly prefix: Uint8Array
   readonly suffix: Uint8Array
}

export interface SinglePhrase extends SeedType {
   readonly seedKey: PAINTABLE_SINGLE_PHRASE
   readonly phrase: string
}

export interface PhrasePair extends SeedType {
   readonly seedKey: PAINTABLE_PHRASE_PAIR
   readonly prefix: string
   readonly suffix: string
}

export type PaintableSeed = PrefixSuffix | SinglePhrase | PhrasePair
