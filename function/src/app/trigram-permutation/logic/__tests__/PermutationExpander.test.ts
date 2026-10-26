/**
 * Tests for Permutation Expansion Logic
 */

import { describe, it, expect } from "@jest/globals"
import {
   expandPrefixSuffixPairs,
   expandAllPairTerms,
   expandTermGroup,
   expandToPermutationsSpec,
} from "../PermutationExpander.js"
import {
   PermutationSpecType,
   type PrefixSuffixSpec,
   type AllPairsSpec,
   type RegionMapCatalog,
   type TrigramProjectSpec,
} from "../../models/spec/index.js"
import type { LiteCIDString } from "../../../../messages/interface/NamedValues.js"

const testCatalog: RegionMapCatalog = {
   "test-region": { cid: "QmTest" as LiteCIDString },
}

describe("PermutationExpander", () => {
   describe("expandPrefixSuffixPairs", () => {
      it("should generate Cartesian product of prefixes and suffixes", () => {
         const spec: PrefixSuffixSpec = {
            expandType: PermutationSpecType.PrefixSuffix,
            regionMapNames: ["test-region"],
            prefixTrigrams: ["☰", "☱"],
            suffixTrigrams: ["☰", "☱", "☲"],
         }

         const result = expandPrefixSuffixPairs(spec)

         const trigrams = result.map((tp) => `${tp.prefix}${tp.suffix}`)
         expect(trigrams).toEqual([
            "☰☰",
            "☰☱",
            "☰☲",
            "☱☰",
            "☱☱",
            "☱☲",
         ])
      })

      it("should include identity pairs when element appears in both lists", () => {
         const spec: PrefixSuffixSpec = {
            expandType: PermutationSpecType.PrefixSuffix,
            regionMapNames: ["test-region"],
            prefixTrigrams: ["☰", "☱"],
            suffixTrigrams: ["☰", "☱"],
         }

         const result = expandPrefixSuffixPairs(spec)
         const trigrams = result.map((tp) => `${tp.prefix}${tp.suffix}`)

         // Full Cartesian product includes identity pairs
         expect(trigrams).toEqual(["☰☰", "☰☱", "☱☰", "☱☱"])
         expect(trigrams).toContain("☰☰")
         expect(trigrams).toContain("☱☱")
      })

      it("should handle single element in both lists", () => {
         const spec: PrefixSuffixSpec = {
            expandType: PermutationSpecType.PrefixSuffix,
            regionMapNames: ["test-region"],
            prefixTrigrams: ["☰"],
            suffixTrigrams: ["☰"],
         }

         const result = expandPrefixSuffixPairs(spec)
         const trigrams = result.map((tp) => `${tp.prefix}${tp.suffix}`)

         expect(trigrams).toEqual(["☰☰"])
      })
   })

   describe("expandAllPairTerms", () => {
      it("should generate all ordered pairs without identity by default", () => {
         const spec: AllPairsSpec = {
            expandType: PermutationSpecType.AllPairs,
            regionMapNames: ["test-region"],
            sourceTrigrams: ["☰", "☱", "☲"],
         }

         const result = expandAllPairTerms(spec)
         const trigrams = result.map((tp) => `${tp.prefix}${tp.suffix}`)

         // Default: no identity, but includes both directions
         expect(trigrams).toEqual([
            "☰☱",
            "☰☲",
            "☱☰",
            "☱☲",
            "☲☰",
            "☲☱",
         ])
         expect(trigrams).not.toContain("☰☰")
         expect(trigrams).not.toContain("☱☱")
         expect(trigrams).not.toContain("☲☲")
      })

      it("should include identity when includeIdentity is true", () => {
         const spec: AllPairsSpec = {
            expandType: PermutationSpecType.AllPairs,
            regionMapNames: ["test-region"],
            sourceTrigrams: ["☰", "☱", "☲"],
            includeIdentity: true,
         }

         const result = expandAllPairTerms(spec)
         const trigrams = result.map((tp) => `${tp.prefix}${tp.suffix}`)

         // All 9 pairs (3 × 3)
         expect(trigrams).toEqual([
            "☰☰",
            "☰☱",
            "☰☲",
            "☱☰",
            "☱☱",
            "☱☲",
            "☲☰",
            "☲☱",
            "☲☲",
         ])
      })

      it("should generate all ordered pairs for two elements", () => {
         const spec: AllPairsSpec = {
            expandType: PermutationSpecType.AllPairs,
            regionMapNames: ["test-region"],
            sourceTrigrams: ["☰", "☱"],
            includeIdentity: true,
         }

         const result = expandAllPairTerms(spec)
         const trigrams = result.map((tp) => `${tp.prefix}${tp.suffix}`)

         expect(trigrams).toEqual(["☰☰", "☰☱", "☱☰", "☱☱"])
      })
   })

   describe("expandTermGroup", () => {
      it("should dispatch to correct expander for PrefixSuffix", () => {
         const spec: PrefixSuffixSpec = {
            expandType: PermutationSpecType.PrefixSuffix,
            regionMapNames: ["test-region"],
            prefixTrigrams: ["A"],
            suffixTrigrams: ["B"],
         }

         const result = expandTermGroup(spec, testCatalog)
         const trigrams = result.termPairs.map((tp) => `${tp.prefix}${tp.suffix}`)

         expect(trigrams).toEqual(["AB"])
         expect(result.regionMapNames).toEqual(["test-region"])
      })

      it("should dispatch to correct expander for AllPairs", () => {
         const spec: AllPairsSpec = {
            expandType: PermutationSpecType.AllPairs,
            regionMapNames: ["test-region"],
            sourceTrigrams: ["A", "B"],
         }

         const result = expandTermGroup(spec, testCatalog)
         const trigrams = result.termPairs.map((tp) => `${tp.prefix}${tp.suffix}`)

         // All ordered pairs without identity
         expect(trigrams).toEqual(["AB", "BA"])
      })
   })

   describe("expandToPermutationsSpec", () => {
      it("should produce one term group per permutation spec", () => {
         const projectSpec: TrigramProjectSpec = {
            projectId: "project-123",
            regionMapCatalog: {
               "bagua-region": {
                  cid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco" as LiteCIDString,
                  description: "Test region",
               },
            },
            permutationSpecs: [
               {
                  expandType: PermutationSpecType.PrefixSuffix,
                  regionMapNames: ["bagua-region"],
                  prefixTrigrams: ["☰"],
                  suffixTrigrams: ["☱", "☲"],
               },
            ],
         }

         const result = expandToPermutationsSpec(projectSpec)

         expect(result.termGroups).toHaveLength(1)
         expect(result.termGroups[0].regionMapNames).toEqual(["bagua-region"])
         expect(result.termGroups[0].termPairs).toEqual([
            { prefix: "☰", suffix: "☱" },
            { prefix: "☰", suffix: "☲" },
         ])
         // CIDs are carried at project level in regionMapNames, not in each group
         expect(result.regionMapNames["bagua-region"]).toBe(
            "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
         )
      })

      it("should carry every region map name on the group", () => {
         const projectSpec: TrigramProjectSpec = {
            projectId: "multi-region-project",
            regionMapCatalog: {
               thumbnail: { cid: "QmThumbnail" as LiteCIDString },
               detail: { cid: "QmDetail" as LiteCIDString },
               zoomed: { cid: "QmZoomed" as LiteCIDString },
            },
            permutationSpecs: [
               {
                  expandType: PermutationSpecType.PrefixSuffix,
                  regionMapNames: ["thumbnail", "detail", "zoomed"],
                  prefixTrigrams: ["☰", "☱"],
                  suffixTrigrams: ["☰", "☱"],
               },
            ],
         }

         const result = expandToPermutationsSpec(projectSpec)
         const [group] = result.termGroups

         // 2 prefixes × 2 suffixes = 4 term pairs, rendered against 3 region maps
         // (the Permutations layer turns this into 4 × 3 = 12 painting tasks)
         expect(group.termPairs).toHaveLength(4)
         expect(group.regionMapNames).toEqual(["thumbnail", "detail", "zoomed"])
         expect(Object.keys(result.regionMapNames)).toEqual([
            "thumbnail",
            "detail",
            "zoomed",
         ])
      })

      it("should handle large expansions", () => {
         const sources = Array.from({ length: 8 }, (_, i) =>
            String.fromCharCode(0x2630 + i),
         )

         const projectSpec: TrigramProjectSpec = {
            projectId: "large-project",
            regionMapCatalog: {
               "test-region": { cid: "QmTest" as LiteCIDString },
            },
            permutationSpecs: [
               {
                  expandType: PermutationSpecType.AllPairs,
                  regionMapNames: ["test-region"],
                  sourceTrigrams: sources,
                  includeIdentity: true,
               },
            ],
         }

         const result = expandToPermutationsSpec(projectSpec)

         // 8 sources with identity = 8 × 8 = 64 term pairs
         expect(result.termGroups[0].termPairs).toHaveLength(64)
      })

      it("should throw error for missing regionMap name", () => {
         const projectSpec: TrigramProjectSpec = {
            projectId: "bad-project",
            regionMapCatalog: {
               "existing-region": { cid: "QmExisting" as LiteCIDString },
            },
            permutationSpecs: [
               {
                  expandType: PermutationSpecType.PrefixSuffix,
                  regionMapNames: ["missing-region"],
                  prefixTrigrams: ["A"],
                  suffixTrigrams: ["B"],
               },
            ],
         }

         expect(() => expandToPermutationsSpec(projectSpec)).toThrow(
            /RegionMap name "missing-region" not found in project catalog/,
         )
      })
   })

   // Behaviour the old expandToMultiTaskRequest covered that now belongs to the
   // Permutations-layer PermutationsExpander (not written yet).
   describe("moved to the Permutations-layer PermutationsExpander", () => {
      it.todo("multiplies term pairs by region maps into task units with plotDataRef.regionMapName")
      it.todo("assigns a genSeed with base64url seedPrefix/seedSuffix to every task")
      it.todo("assigns a unique task index to every task")
      it.todo("reports project-level counts (term groups, tasks, region maps)")
   })
})
