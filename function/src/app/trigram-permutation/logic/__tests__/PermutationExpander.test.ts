/**
 * Tests for Permutation Expansion Logic
 */

import { describe, it, expect } from "@jest/globals"
import {
   pairPrefixSuffixSource,
   pairAllPairsSource,
   expandTermPairs,
   expandToMultiTaskRequest,
} from "../PermutationExpander.js"
import {
   PermutationSpecType,
   type PrefixSuffixSpec,
   type AllPairsSpec,
   type TrigramProjectSpec,
} from "../../models/spec/index.js"
import type { LiteCIDString } from "../../../../messages/interface/NamedValues.js"

describe("PermutationExpander", () => {
   describe("pairPrefixSuffixSource", () => {
      it("should generate Cartesian product of prefixes and suffixes", () => {
         const spec: PrefixSuffixSpec = {
            expandType: PermutationSpecType.PrefixSuffix,
            regionMapNames: ["test-region"],
            prefixTrigrams: ["☰", "☱"],
            suffixTrigrams: ["☰", "☱", "☲"],
         }

         const result = pairPrefixSuffixSource(spec)

         // Returns TermPairing[], extract trigram pairs for testing
         const trigrams = result.map(
            (tp) => `${tp.prefixTrigram}${tp.suffixTrigram}`,
         )
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
            fileNameExpression: undefined,
         }

         const result = pairPrefixSuffixSource(spec)
         const trigrams = result.map(
            (tp) => `${tp.prefixTrigram}${tp.suffixTrigram}`,
         )

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
            fileNameExpression: undefined,
         }

         const result = pairPrefixSuffixSource(spec)
         const trigrams = result.map(
            (tp) => `${tp.prefixTrigram}${tp.suffixTrigram}`,
         )

         expect(trigrams).toEqual(["☰☰"])
      })
   })

   describe("pairAllPairsSource", () => {
      it("should generate all ordered pairs without identity by default", () => {
         const spec: AllPairsSpec = {
            expandType: PermutationSpecType.AllPairs,
            regionMapNames: ["test-region"],
            sourceTrigrams: ["☰", "☱", "☲"],
            fileNameExpression: undefined,
         }

         const result = pairAllPairsSource(spec)
         const trigrams = result.map(
            (tp) => `${tp.prefixTrigram}${tp.suffixTrigram}`,
         )

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
            fileNameExpression: undefined,
         }

         const result = pairAllPairsSource(spec)
         const trigrams = result.map(
            (tp) => `${tp.prefixTrigram}${tp.suffixTrigram}`,
         )

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
            fileNameExpression: undefined,
         }

         const result = pairAllPairsSource(spec)
         const trigrams = result.map(
            (tp) => `${tp.prefixTrigram}${tp.suffixTrigram}`,
         )

         expect(trigrams).toEqual(["☰☰", "☰☱", "☱☰", "☱☱"])
      })
   })

   describe("expandTermPairs", () => {
      it("should dispatch to correct expander for PrefixSuffix", () => {
         const spec: PrefixSuffixSpec = {
            expandType: PermutationSpecType.PrefixSuffix,
            regionMapNames: ["test-region"],
            prefixTrigrams: ["A"],
            suffixTrigrams: ["B"],
            fileNameExpression: undefined,
         }

         const result = expandTermPairs(spec)
         const trigrams = result.map(
            (tp) => `${tp.prefixTrigram}${tp.suffixTrigram}`,
         )

         expect(trigrams).toEqual(["AB"])
      })

      it("should dispatch to correct expander for AllPairs", () => {
         const spec: AllPairsSpec = {
            expandType: PermutationSpecType.AllPairs,
            regionMapNames: ["test-region"],
            sourceTrigrams: ["A", "B"],
            fileNameExpression: undefined,
         }

         const result = expandTermPairs(spec)
         const trigrams = result.map(
            (tp) => `${tp.prefixTrigram}${tp.suffixTrigram}`,
         )

         // All ordered pairs without identity
         expect(trigrams).toEqual(["AB", "BA"])
      })
   })

   describe("expandToMultiTaskRequest", () => {
      it("should generate task units with correct structure", () => {
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

         const result = expandToMultiTaskRequest(projectSpec)

         expect(result.taskUnits).toHaveLength(2)

         // Validate first task structure
         expect(result.taskUnits[0].plotDataRef.regionMapName).toBe(
            "bagua-region",
         )
         // CID is stored at project level in regionMapNames, not in each task
         expect(result.regionMapNames["bagua-region"]).toBe(
            "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
         )
         expect(result.taskUnits[0].domainExtension.prefixTrigram).toBe("☰")
         expect(result.taskUnits[0].domainExtension.suffixTrigram).toBe("☱")
         expect(result.taskUnits[0].genSeed).toBeDefined()
         expect(result.taskUnits[0].genSeed.seedPrefix).toBeDefined()
         expect(result.taskUnits[0].genSeed.seedSuffix).toBeDefined()

         // Validate second task
         expect(result.taskUnits[1].domainExtension.prefixTrigram).toBe("☰")
         expect(result.taskUnits[1].domainExtension.suffixTrigram).toBe("☲")
      })

      it("should multiply tasks by regionMap count", () => {
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

         const result = expandToMultiTaskRequest(projectSpec)

         // 2 prefixes × 2 suffixes = 4 trigrams
         // 4 trigrams × 3 regionMaps = 12 tasks
         expect(result.taskUnits).toHaveLength(12)

         // Verify each trigram appears 3 times (once per regionMap)
         const trigramCounts: Record<string, number> = {}
         for (const t of result.taskUnits) {
            const trigram = `${t.domainExtension.prefixTrigram}${t.domainExtension.suffixTrigram}`
            trigramCounts[trigram] = (trigramCounts[trigram] ?? 0) + 1
         }
         expect(trigramCounts["☰☰"]).toBe(3)
         expect(trigramCounts["☰☱"]).toBe(3)
         expect(trigramCounts["☱☰"]).toBe(3)
         expect(trigramCounts["☱☱"]).toBe(3)

         // Verify each regionMap appears 4 times (once per trigram)
         const regionCounts: Record<string, number> = {}
         for (const t of result.taskUnits) {
            const regionName = t.plotDataRef.regionMapName ?? "unknown"
            regionCounts[regionName] = (regionCounts[regionName] ?? 0) + 1
         }
         expect(regionCounts.thumbnail).toBe(4)
         expect(regionCounts.detail).toBe(4)
         expect(regionCounts.zoomed).toBe(4)
      })

      it("should handle large expansions efficiently", () => {
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

         const result = expandToMultiTaskRequest(projectSpec)

         // 8 sources with identity = 8 * 8 = 64 tasks × 1 regionMap = 64 tasks
         expect(result.taskUnits).toHaveLength(64)

         // All task indices should be unique
         const taskIndices = new Set(
            result.taskUnits.map(
               (t) => t.domainExtension.paintProjectTaskIndex,
            ),
         )
         expect(taskIndices.size).toBe(64)
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

         expect(() => expandToMultiTaskRequest(projectSpec)).toThrow(
            /RegionMap name "missing-region" not found in project catalog/,
         )
      })

      it("should produce valid MultiTaskRequestModel", () => {
         const projectSpec: TrigramProjectSpec = {
            projectId: "dto-test-project",
            regionMapCatalog: {
               "bagua-region": {
                  cid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco" as LiteCIDString,
               },
            },
            permutationSpecs: [
               {
                  expandType: PermutationSpecType.AllPairs,
                  regionMapNames: ["bagua-region"],
                  sourceTrigrams: ["☰", "☱"],
                  includeIdentity: false,
               },
            ],
         }

         const result = expandToMultiTaskRequest(projectSpec)

         expect(result.projectDomain.termPairSourceCount).toBe(1)
         expect(result.projectDomain.taskCount).toBe(2) // ☰☱, ☱☰
         expect(result.projectDomain.regionMapCount).toBe(1)
         expect(result.regionMapNames["bagua-region"]).toBe(
            "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
         )
         expect(result.taskUnits).toHaveLength(2)
      })

      it("should include regionMapName in task plotDataRef", () => {
         const projectSpec: TrigramProjectSpec = {
            projectId: "domain-test",
            regionMapCatalog: {
               thumbnail: { cid: "QmThumb" as LiteCIDString },
               detail: { cid: "QmDetail" as LiteCIDString },
            },
            permutationSpecs: [
               {
                  expandType: PermutationSpecType.PrefixSuffix,
                  regionMapNames: ["thumbnail", "detail"],
                  prefixTrigrams: ["A"],
                  suffixTrigrams: ["B"],
               },
            ],
         }

         const result = expandToMultiTaskRequest(projectSpec)

         // 1 trigram × 2 regionMaps = 2 tasks
         expect(result.taskUnits).toHaveLength(2)

         // Each task should have the correct regionMapName in its plotDataRef
         const regionNames = result.taskUnits.map(
            (t) => t.plotDataRef.regionMapName,
         )
         expect(regionNames).toContain("thumbnail")
         expect(regionNames).toContain("detail")
      })
   })
})
