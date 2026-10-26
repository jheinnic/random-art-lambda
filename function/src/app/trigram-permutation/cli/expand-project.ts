#!/usr/bin/env tsx
/**
 * CLI Tool: Expand Trigram Project
 *
 * Reads a TrigramProjectSpec JSON file, expands it into a PermutationsProjectSpec, and lists
 * the painting tasks it implies (one per term pair × region map in each group)
 *
 * Usage:
 *   tsx src/app/trigram-permutation/cli/expand-project.ts <spec-file.json>
 *
 * Example:
 *   tsx src/app/trigram-permutation/cli/expand-project.ts examples/bagua-full.json
 */

import { readFileSync } from "fs"
import { resolve } from "path"
import type { TrigramProjectSpec } from "../models/spec/index.js"
import { expandToPermutationsSpec } from "../logic/PermutationExpander.js"

function main(): void {
   const args = process.argv.slice(2)

   if (args.length === 0) {
      console.error("Error: No spec file provided")
      console.error("")
      console.error("Usage:")
      console.error("  tsx expand-project.ts <spec-file.json>")
      console.error("")
      console.error("Example:")
      console.error("  tsx expand-project.ts examples/bagua-full.json")
      process.exit(1)
   }

   const specPath = resolve(args[0])

   try {
      // Read and parse spec file
      const specContent = readFileSync(specPath, "utf-8")
      const spec: TrigramProjectSpec = JSON.parse(specContent)

      // Display project info
      console.log(`\n📋 Project: ${spec.projectId}`)
      console.log(`   Permutation Specs: ${spec.permutationSpecs.length}`)

      // Display RegionMap catalog
      const catalogKeys = Object.keys(spec.regionMapCatalog)
      console.log(`   RegionMap Catalog: ${catalogKeys.length} entries`)
      for (const name of catalogKeys) {
         const entry = spec.regionMapCatalog[name]
         const desc = entry.description != null ? ` (${entry.description})` : ""
         console.log(`      - ${name}: ${entry.cid}${desc}`)
      }

      // Display permutation specs
      console.log(`\n   Permutation Specs:`)
      for (let i = 0; i < spec.permutationSpecs.length; i++) {
         const permSpec = spec.permutationSpecs[i]
         console.log(
            `      ${i + 1}. ${permSpec.expandType} → ${permSpec.regionMapNames.join(", ")}`,
         )
      }

      // Expand to PermutationsProjectSpec
      const permutations = expandToPermutationsSpec(spec)

      // The Permutations layer will produce one painting task per (term pair × region map)
      const tasks = permutations.termGroups.flatMap((group) =>
         group.termPairs.flatMap((pair) =>
            group.regionMapNames.map((regionMapName) => ({ pair, regionMapName })),
         ),
      )

      console.log(`\n✅ Expanded to ${tasks.length} tasks:\n`)

      // Display tasks
      tasks.forEach(({ pair, regionMapName }, index) => {
         const seedPhrase = `${pair.prefix} ${pair.suffix}`
         console.log(
            `${(index + 1).toString().padStart(3)}. ${seedPhrase.padEnd(6)} @ ${regionMapName}`,
         )
      })

      console.log(`\n📊 Summary:`)
      console.log(`   Total tasks: ${tasks.length}`)
      console.log(`   Project ID: ${spec.projectId}`)
      console.log(`   Term groups: ${permutations.termGroups.length}`)

      // Output JSON for piping to other tools
      if (args.includes("--json")) {
         console.log("\n--- JSON Output ---")
         console.log(JSON.stringify(permutations, null, 2))
      }
   } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
         console.error(`Error: File not found: ${specPath}`)
      } else if (error instanceof SyntaxError) {
         console.error(`Error: Invalid JSON in file: ${specPath}`)
         console.error(error.message)
      } else {
         console.error(`Error: ${(error as Error).message}`)
      }
      process.exit(1)
   }
}

main()
