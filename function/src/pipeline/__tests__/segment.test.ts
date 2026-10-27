/**
 * Tests pinning segment blueprint replay: a blueprint records operations and
 * buildHelper() replays them onto a real builder.
 */

import { describe, it, expect } from "@jest/globals"
import { createPipeline, createSegmentBlueprintFromBuilder } from "../index.js"

// A builder that declares virtual `v` and a feature consuming it.
const withVirtual = () =>
   createPipeline()
      .withContextSubject<{ x: string }>()
      .addVirtualFeature("v")
      .withContextSubject<{ k: string }>()
      .addPublicFeature("consumer", {
         k: {
            method: (x: string) => `${x}!`,
            selectors: [["v", "x"]] as const,
         },
      })

describe("segment blueprints", () => {
   it("replay their operations onto the builder they are applied to", async () => {
      const addGreeting = createSegmentBlueprintFromBuilder(withVirtual())
         .withContextSubject<{ g: string }>()
         .addPublicFeature("greeting", { g: "'hello'" })
         .buildHelper()

      const run = addGreeting(
         withVirtual()
            .withContextSubject<{ x: string }>()
            .addPublicFeature("v", { x: "'X'" }),
      ).buildPipeline({
         g: ["greeting", "g"] as const,
         k: ["consumer", "k"] as const,
      })

      await expect(run({})({})).resolves.toStrictEqual({ g: "hello", k: "X!" })
   })

   it("can fulfill a virtual declared by the witness; the fulfillment runs in the virtual's slot", async () => {
      const fulfillV = createSegmentBlueprintFromBuilder(withVirtual())
         .withContextSubject<{ x: string }>()
         .addPublicFeature("v", { x: "'X'" })
         .buildHelper()

      const run = fulfillV(withVirtual()).buildPipeline({
         k: ["consumer", "k"] as const,
      })

      await expect(run({})({})).resolves.toStrictEqual({ k: "X!" })
   })
})
