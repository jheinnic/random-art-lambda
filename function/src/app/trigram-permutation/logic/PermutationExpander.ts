/**
 * Permutation Expansion Logic
 *
 * Converts compact PermutationSpec into arrays of TrigramTask objects
 */

import { Injectable } from "@nestjs/common"

import {
   PermutationSpec,
   PermutationSpecType,
   PrefixSuffixSpec,
   AllPairsSpec,
   RegionMapCatalog,
   TrigramProjectSpec,
} from "../models/spec/index.js"
import type { MultiTaskRequestModel } from "../../../painting/messages/dto/MultiPaintingProjectRequest.js"
import type { GenModelSeed } from "../../../painting/messages/values/GenModelSeed.js"
import type { PaintingTask } from "../../../painting/messages/values/PaintingTask.js"
import { type PlotDataNameRef } from "../../../painting/messages/values/PlotDataRef.js"
import type {
   LiteCIDString,
   PrefixString,
   SuffixString,
} from "../../../messages/interface/NamedValues.js"
import { TrigramPaintProject } from "../models/paint/TrigramPaintProject.js"
import { TrigramPaintTask } from "../models/paint/TrigramPaintTask.js"
import { TermPairSource } from "../models/paint/TermPairSource.js"
import { TermPairSourceType } from "../models/paint/TermPairSourceType.js"
import { SeedEncodingUtil } from "../../../messages/components/SeedEncodingUtil.js"

interface TermPairing {
   prefixTrigram: string
   suffixTrigram: string
   modelSeed: GenModelSeed
   prefixIndex: number
   suffixIndex: number
   termPairIndex: number
}

/**
 * Expands a PrefixSuffixSpec into trigram strings
 *
 * Generates Cartesian product: prefixes × suffixes
 *
 * @param spec - Prefix-suffix permutation specification
 * @returns Array of trigram strings
 */
export function pairPrefixSuffixSource(spec: PrefixSuffixSpec): TermPairing[] {
   const { prefixTrigrams, suffixTrigrams } = spec

   const seedSuffixes: Array<[string, SuffixString]> = suffixTrigrams.map(
      (suffixTrigram: string): [string, SuffixString] => {
         return [
            suffixTrigram,
            SeedEncodingUtil.fromEncodedSuffix(suffixTrigram, "utf-8"),
         ]
      },
   )

   let termPairIndex: number = 0
   return prefixTrigrams.flatMap(
      (prefixTrigram: string, prefixIndex: number): TermPairing[] => {
         const seedPrefix: PrefixString = SeedEncodingUtil.fromEncodedPrefix(
            prefixTrigram,
            "utf-8",
         )
         return seedSuffixes.map(
            (
               [suffixTrigram, seedSuffix]: [string, SuffixString],
               suffixIndex: number,
            ): TermPairing => {
               const retVal = {
                  prefixTrigram,
                  suffixTrigram,
                  modelSeed: {
                     seedPrefix,
                     seedSuffix,
                  },
                  prefixIndex,
                  suffixIndex,
                  termPairIndex,
               }
               termPairIndex = termPairIndex + 1
               return retVal
            },
         )
      },
   )
}

/**
 * Expands an AllPairsSpec into trigram strings
 *
 * Generates all ordered pairs from sources list
 *
 * @param spec - All-pairs permutation specification
 * @returns Array of trigram strings
 */
export function pairAllPairsSource(spec: AllPairsSpec): TermPairing[] {
   const { sourceTrigrams, includeIdentity = false } = spec
   // const pairCount = includeIdentity
   //    ? sourceTrigrams.length * sourceTrigrams.length
   //    : sourceTrigrams.length * (sourceTrigrams.length - 1)

   const seedSources: Array<[string, PrefixString & SuffixString]> =
      sourceTrigrams.map(
         (sourceTrigram: string): [string, PrefixString & SuffixString] => {
            const seedPrefix: PrefixString = SeedEncodingUtil.fromEncodedPrefix(
               sourceTrigram,
               "utf-8",
            )
            return [sourceTrigram, SeedEncodingUtil.reuseTerm(seedPrefix)]
         },
      )

   let termPairIndex: number = 0
   return seedSources.flatMap(
      (
         [prefixTrigram, seedPrefix]: [string, PrefixString & SuffixString],
         prefixIndex: number,
      ): TermPairing[] => {
         const filteredSource: Array<[string, PrefixString & SuffixString]> =
            includeIdentity
               ? seedSources
               : seedSources.filter((_x, index) => {
                    return index !== prefixIndex
                 })

         return filteredSource.map(
            (
               [suffixTrigram, seedSuffix]: [
                  string,
                  PrefixString & SuffixString,
               ],
               suffixIndex: number,
            ): TermPairing => {
               const retVal = {
                  prefixTrigram,
                  suffixTrigram,
                  modelSeed: {
                     seedPrefix,
                     seedSuffix,
                  },
                  prefixIndex,
                  suffixIndex,
                  termPairIndex,
               }
               termPairIndex = termPairIndex + 1
               return retVal
            },
         )
      },
   )
}

/**
 * Expands any PermutationSpec into prefix and suffix trigram pairings
 *
 * @param spec - Permutation specification (any type)
 * @returns Array of TermPairing, one per unique prefix/suffix trigram pairing.
 */
export function expandTermPairs(spec: PermutationSpec): TermPairing[] {
   switch (spec.expandType) {
      case PermutationSpecType.PrefixSuffix: {
         return pairPrefixSuffixSource(spec)
      }
      case PermutationSpecType.AllPairs: {
         return pairAllPairsSource(spec)
      }
      default: {
         // TypeScript exhaustiveness check
         const _exhaustive: never = spec
         throw new Error(`Unknown expand type: ${JSON.stringify(spec)}`)
      }
   }
}

/**
 * Validates that all regionMapNames in a spec exist in the catalog
 *
 * @param regionMapNames - Names referenced by the permutation spec
 * @param catalog - Project-level catalog
 * @throws Error if any name is not found in catalog
 */
function validateRegionMapNames(
   regionMapNames: string[],
   catalog: RegionMapCatalog,
): void {
   for (const name of regionMapNames) {
      if (catalog[name] == null) {
         const available = JSON.stringify(Object.keys(catalog))
         throw new Error(
            `RegionMap name "${name}" not found in project catalog. ` +
               `Available names: ${available}`,
         )
      }
   }
}

/**
 * Expands a TrigramProjectSpec into a MultiTaskRequestModel
 *
 * Generates ULID for each task and populates all fields for the painting framework.
 * Each trigram is rendered once per RegionMap in regionMapNames.
 *
 * Total tasks = (trigram count) × (regionMap count)
 *
 * @param projectSpec - Complete project specification with catalog and permutation
 * @returns MultiTaskRequestModel ready for painting framework
 */
export function expandToMultiTaskRequest(
   projectSpec: TrigramProjectSpec,
): MultiTaskRequestModel<TrigramPaintTask, TrigramPaintProject> {
   const { regionMapCatalog, permutationSpecs } = projectSpec

   // Build resourceMapNames from catalog (only entries referenced by this spec)
   // Uses LiteCIDString - CID format validation is deferred to FlowProducer
   const regionMapNames: Record<string, LiteCIDString> = {}
   for (const name of Object.keys(regionMapCatalog)) {
      regionMapNames[name] = regionMapCatalog[name].cid
   }

   // First pass--expand prefix/suffix term pairs
   const termPairsBySpec: Array<[PermutationSpec, TermPairing[]]> =
      permutationSpecs.map(
         (
            permutationSpec: PermutationSpec,
         ): [PermutationSpec, TermPairing[]] => {
            // Validate regionMapNames against catalog
            validateRegionMapNames(
               permutationSpec.regionMapNames,
               regionMapCatalog,
            )

            return [permutationSpec, expandTermPairs(permutationSpec)]
         },
      )

   // Second step--cartesian product with regionMaps for true tasks
   let nextPaintProjectTaskIndex: number = 0
   const allTaskSources: Array<
      [TermPairSource, Array<PaintingTask<TrigramPaintTask, PlotDataNameRef>>]
   > = termPairsBySpec.map(
      (
         [permutationSpec, termPairsList]: [PermutationSpec, TermPairing[]],
         termPairSourceIndex: number,
      ): [
         TermPairSource,
         Array<PaintingTask<TrigramPaintTask, PlotDataNameRef>>,
      ] => {
         const retval: [
            TermPairSource,
            Array<PaintingTask<TrigramPaintTask, PlotDataNameRef>>,
         ] = expandRegionMaps(
            permutationSpec,
            regionMapNames,
            termPairsList,
            termPairSourceIndex,
            nextPaintProjectTaskIndex,
         )
         nextPaintProjectTaskIndex =
            nextPaintProjectTaskIndex + termPairsList.length
         return retval
      },
   )

   // Build project domain
   const projectDomain: TrigramPaintProject = {
      termPairSourceCount: permutationSpecs.length,
      taskCount: nextPaintProjectTaskIndex,
      regionMapCount: Object.keys(regionMapNames).length,
      termPairSources: allTaskSources.map(
         ([termPairSource, _taskList]: [
            TermPairSource,
            Array<PaintingTask<TrigramPaintTask, PlotDataNameRef>>,
         ]): TermPairSource => {
            return termPairSource
         },
      ),
   }

   return {
      projectDomain,
      regionMapNames,
      taskUnits: allTaskSources.flatMap(
         ([_termPairSource, taskList]: [
            TermPairSource,
            Array<PaintingTask<TrigramPaintTask, PlotDataNameRef>>,
         ]): Array<PaintingTask<TrigramPaintTask, PlotDataNameRef>> => {
            return taskList
         },
      ),
   }
}

function expandRegionMaps(
   permutationSpec: PermutationSpec,
   regionMapCatalog: Record<string, LiteCIDString>,
   termPairsList: TermPairing[],
   termPairSourceIndex: number,
   nextPaintProjectTaskIndex: number,
): [TermPairSource, Array<PaintingTask<TrigramPaintTask, PlotDataNameRef>>] {
   let termPairSource: TermPairSource
   let termPairSourceType: TermPairSourceType
   const regionMapNames: string[] = permutationSpec.regionMapNames
   const termPairCount: number = termPairsList.length
   const regionMapCount: number = regionMapNames.length
   const taskCount: number = termPairCount * regionMapCount

   switch (permutationSpec.expandType) {
      case PermutationSpecType.PrefixSuffix: {
         const prefixCount = permutationSpec.prefixTrigrams.length
         const suffixCount = permutationSpec.suffixTrigrams.length
         termPairSourceType = TermPairSourceType.PrefixSuffix
         termPairSource = {
            termPairSourceType,
            termPairSourceIndex,
            taskCount,
            regionMapCount,
            termPairCount,
            prefixCount,
            suffixCount,
         }
         break
      }
      case PermutationSpecType.AllPairs: {
         const sourceTrigramCount = permutationSpec.sourceTrigrams.length
         const identityPairsIncluded: boolean =
            permutationSpec.includeIdentity === true
         termPairSourceType = TermPairSourceType.AllPairs
         termPairSource = {
            termPairSourceType,
            termPairSourceIndex,
            taskCount,
            regionMapCount,
            termPairCount,
            sourceTrigramCount,
            identityPairsIncluded,
         }
         break
      }
      default: {
         const _exhaustiveCheck: never = permutationSpec
         throw new Error(`Unhandled type: ${JSON.stringify(permutationSpec)}`)
      }
   }

   const taskList = regionMapNames.flatMap(
      (
         regionMapName: string,
         regionMapIndex: number,
      ): Array<PaintingTask<TrigramPaintTask, PlotDataNameRef>> => {
         const plotDataRef: PlotDataNameRef = {
            regionMapName,
         }
         return termPairsList.map(
            (
               termPairing: TermPairing,
            ): PaintingTask<TrigramPaintTask, PlotDataNameRef> => {
               const prefixIndex = termPairing.prefixIndex
               const prefixTrigram = termPairing.prefixTrigram
               const suffixIndex = termPairing.suffixIndex
               const suffixTrigram = termPairing.suffixTrigram
               const termPairIndex: number = termPairing.termPairIndex
               const paintableSeed = termPairing.modelSeed
               const paintProjectTaskIndex: number = nextPaintProjectTaskIndex
               nextPaintProjectTaskIndex = nextPaintProjectTaskIndex + 1

               return {
                  genSeed: paintableSeed,
                  plotDataRef,
                  domainExtension: {
                     termPairSourceType,
                     paintProjectTaskIndex,
                     termPairSourceIndex,
                     regionMapIndex,
                     termPairIndex,
                     prefixTrigram,
                     prefixIndex,
                     suffixTrigram,
                     suffixIndex,
                  },
               }
            },
         )
      },
   )

   return [termPairSource, taskList]
}

/**
 * Injectable service for expanding TrigramProjectSpec into MultiTaskRequestModel.
 *
 * This is a stateless singleton that wraps the pure expansion functions
 * for use with NestJS dependency injection.
 *
 * @example
 * constructor(private readonly expander: PermutationExpander) {}
 *
 * const request = this.expander.expandToMultiTaskRequest(spec)
 */
@Injectable()
export class PermutationExpander {
   /**
    * Expands a TrigramProjectSpec into a MultiTaskRequestModel.
    *
    * @param projectSpec - Complete project specification
    * @returns MultiTaskRequestModel ready for painting framework
    */
   expandToMultiTaskRequest(
      projectSpec: TrigramProjectSpec,
   ): MultiTaskRequestModel<TrigramPaintTask, TrigramPaintProject> {
      return expandToMultiTaskRequest(projectSpec)
   }
}
