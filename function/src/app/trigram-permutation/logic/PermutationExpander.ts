import { Injectable } from "@nestjs/common"

import {
   PermutationSpec,
   PermutationSpecType,
   PrefixSuffixSpec,
   AllPairsSpec,
   RegionMapCatalog,
   TrigramProjectSpec,
} from "../models/spec/index.js"
import type {
   PermutationTermPair,
   PermutationTermGroup,
   PermutationsProjectSpec,
} from "../../../painting/permutations/spec/index.js"
import type { LiteCIDString } from "../../../messages/interface/index.js"

function buildRegionMapNames(catalog: RegionMapCatalog): Record<string, LiteCIDString> {
   const result: Record<string, LiteCIDString> = {}
   for (const [name, entry] of Object.entries(catalog)) {
      result[name] = entry.cid
   }
   return result
}

function validateRegionMapNames(regionMapNames: string[], catalog: RegionMapCatalog): void {
   for (const name of regionMapNames) {
      if (catalog[name] == null) {
         const available = JSON.stringify(Object.keys(catalog))
         throw new Error(
            `RegionMap name "${name}" not found in project catalog. Available names: ${available}`,
         )
      }
   }
}

export function expandPrefixSuffixPairs(spec: PrefixSuffixSpec): ReadonlyArray<PermutationTermPair> {
   const { prefixTrigrams, suffixTrigrams } = spec
   const pairs: PermutationTermPair[] = []
   for (const prefix of prefixTrigrams) {
      for (const suffix of suffixTrigrams) {
         pairs.push({ prefix, suffix })
      }
   }
   return pairs
}

export function expandAllPairTerms(spec: AllPairsSpec): ReadonlyArray<PermutationTermPair> {
   const { sourceTrigrams, includeIdentity = false } = spec
   const pairs: PermutationTermPair[] = []
   for (let i = 0; i < sourceTrigrams.length; i++) {
      for (let j = 0; j < sourceTrigrams.length; j++) {
         if (i !== j || includeIdentity) {
            pairs.push({ prefix: sourceTrigrams[i], suffix: sourceTrigrams[j] })
         }
      }
   }
   return pairs
}

export function expandTermGroup(
   spec: PermutationSpec,
   catalog: RegionMapCatalog,
): PermutationTermGroup {
   validateRegionMapNames(spec.regionMapNames, catalog)

   let termPairs: ReadonlyArray<PermutationTermPair>
   switch (spec.expandType) {
      case PermutationSpecType.PrefixSuffix:
         termPairs = expandPrefixSuffixPairs(spec)
         break
      case PermutationSpecType.AllPairs:
         termPairs = expandAllPairTerms(spec)
         break
      default:
         throw new Error(`Unknown expand type: ${JSON.stringify(spec as never)}`)

   }

   return { regionMapNames: spec.regionMapNames, termPairs }
}

export function expandToPermutationsSpec(projectSpec: TrigramProjectSpec): PermutationsProjectSpec {
   const { regionMapCatalog, permutationSpecs } = projectSpec
   return {
      regionMapNames: buildRegionMapNames(regionMapCatalog),
      termGroups: permutationSpecs.map((spec) => expandTermGroup(spec, regionMapCatalog)),
   }
}

/**
 * Injectable service that expands a TrigramProjectSpec into a PermutationsProjectSpec.
 *
 * The PermutationsProjectSpec is then passed to the Permutations middleware layer
 * (PermutationsExpander) which handles base64url encoding, index assignment, and
 * AppDomainMemento serialization before handing off to the RandomArt FlowProducer.
 */
@Injectable()
export class PermutationExpander {
   expandToPermutationsSpec(projectSpec: TrigramProjectSpec): PermutationsProjectSpec {
      return expandToPermutationsSpec(projectSpec)
   }
}
