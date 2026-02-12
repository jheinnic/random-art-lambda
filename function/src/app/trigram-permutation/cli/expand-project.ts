#!/usr/bin/env tsx
/**
 * CLI Tool: Expand Trigram Project
 *
 * Reads a TrigramProjectSpec JSON file and expands it into PaintingTask objects
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
import { expandToMultiTaskRequest } from "../logic/PermutationExpander.js"
import type { TrigramPaintTask } from "../models/paint/TrigramPaintTask.js"

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

      // Expand to MultiTaskRequest
      const request = expandToMultiTaskRequest(spec)

      console.log(`\n✅ Expanded to ${request.taskUnits.length} tasks:\n`)

      // Display tasks
      request.taskUnits.forEach((task, index) => {
         const ext: TrigramPaintTask = task.domainExtension
         const seedPhrase = `${ext.prefixTrigram} ${ext.suffixTrigram}`
         const regionMapName = task.plotDataRef.regionMapName ?? "?"
         console.log(
            `${(index + 1).toString().padStart(3)}. ${seedPhrase.padEnd(6)} @ ${regionMapName}`,
         )
      })

      console.log(`\n📊 Summary:`)
      console.log(`   Total tasks: ${request.taskUnits.length}`)
      console.log(`   Project ID: ${spec.projectId}`)
      console.log(
         `   Project Domain: ${request.projectDomain.termPairSourceCount} sources, ${request.projectDomain.taskCount} tasks`,
      )

      // Output JSON for piping to other tools
      if (args.includes("--json")) {
         console.log("\n--- JSON Output ---")
         console.log(JSON.stringify(request, null, 2))
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
