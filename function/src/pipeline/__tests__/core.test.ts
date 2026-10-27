/**
 * Tests pinning the current buildPipeline() runtime semantics: execution order,
 * initial-input namespaces, context visibility, virtual-slot fulfillment and pruning.
 *
 * Tests under "known limitations" pin behaviour recorded in docs/TECH_DEBT.md.
 * They are expected to change when the corresponding item is addressed.
 */

import { describe, it, expect } from "@jest/globals"
import { createPipeline } from "../index.js"

describe("buildPipeline runtime", () => {
   describe("execution order", () => {
      it("evaluates features in insertion order, so a later feature can read an earlier one", async () => {
         const run = createPipeline()
            .withContextSubject<{ y: string }>()
            .addPublicFeature("a", { y: "'A'" })
            .withContextSubject<{ z: string }>()
            .addPublicFeature("b", { z: "a.y + '!'" })
            .buildPipeline({ z: ["b", "z"] as const })

         await expect(run({})({})).resolves.toStrictEqual({ z: "A!" })
      })

      it("passes method-form selector values as positional arguments", async () => {
         const run = createPipeline()
            .withContextSubject<{ first: string; second: string }>()
            .extendInitial("input", {})
            .withContextSubject<{ joined: string }>()
            .addPublicFeature("out", {
               joined: {
                  method: (a: string, b: string) => `${a}-${b}`,
                  selectors: [
                     ["input", "first"],
                     ["input", "second"],
                  ] as const,
               },
            })
            .buildPipeline({ joined: ["out", "joined"] as const })

         await expect(
            run({})({ input: { first: "x", second: "y" } }),
         ).resolves.toStrictEqual({ joined: "x-y" })
      })
   })

   describe("extendInitial namespaces", () => {
      const run = createPipeline()
         .withContextSubject<{ id: string; mode: string }>()
         .extendInitial("input", { mode: "default" })
         .withContextSubject<{ s: string }>()
         .addPublicFeature("out", { s: "input.id + ':' + input.mode" })
         .buildPipeline({ s: ["out", "s"] as const })

      it("places caller input under its namespace and fills omitted fields from defaults", async () => {
         await expect(run({})({ input: { id: "x" } })).resolves.toStrictEqual({
            s: "x:default",
         })
      })

      it("lets caller-supplied values win over defaults", async () => {
         await expect(
            run({})({ input: { id: "x", mode: "custom" } }),
         ).resolves.toStrictEqual({ s: "x:custom" })
      })

      it("lets the caller omit a namespace whose fields all have defaults", async () => {
         const runOptional = createPipeline()
            .withContextSubject<{ flag?: string }>()
            .extendInitial("opt", { flag: "on" })
            .withContextSubject<{ s: string }>()
            .addPublicFeature("out", { s: "opt.flag" })
            .buildPipeline({ s: ["out", "s"] as const })

         // `{}` type-checks only because OptionalWithProp makes `opt` optional.
         await expect(runOptional({})({})).resolves.toStrictEqual({ s: "on" })
      })
   })

   describe("context visibility", () => {
      it("lets direct expressions read private features and private injections", async () => {
         const run = createPipeline()
            .withContextSubject<{ v: string }>()
            .addPrivateInjection("secret")
            .withContextSubject<{ k: string }>()
            .addPrivateFeature("hidden", { k: "'H'" })
            .withContextSubject<{ s: string }>()
            .addPublicFeature("out", { s: "secret.v + hidden.k" })
            .buildPipeline({ s: ["out", "s"] as const })

         await expect(run({ secret: { v: "S" } })({})).resolves.toStrictEqual({
            s: "SH",
         })
      })

      describe("indirect expressions", () => {
         const run = createPipeline()
            .withContextSubject<{ expr: string }>()
            .extendInitial("input", {})
            .withContextSubject<{ k: string }>()
            .addPrivateFeature("hidden", { k: "'H'" })
            .withContextSubject<{ k: string }>()
            .addPublicFeature("shown", { k: "'P'" })
            .withContextSubject<{ s: string }>()
            .addPublicFeature("out", { s: ["input.expr"] as const })
            .buildPipeline({ s: ["out", "s"] as const })

         it("evaluate the outer expression to get the inner one, then evaluate that", async () => {
            await expect(
               run({})({ input: { expr: "shown.k" } }),
            ).resolves.toStrictEqual({ s: "P" })
         })

         it("evaluate the inner expression against the public context only", async () => {
            const result = await run({})({ input: { expr: "hidden" } })
            expect(result.s).toBeUndefined()
         })
      })

      it("keeps step outputs out of the feature contexts but includes them in the result", async () => {
         const run = createPipeline()
            .withContextSubject<{ k: string }>()
            .addPrivateFeature("hidden", { k: "'H'" })
            .withContextSubject<{ len: number }>()
            .addStep("measure", {
               method: (k: string) => ({ len: k.length }),
               selectors: [["hidden", "k"]] as const,
            })
            .buildPipeline({ len: ["measure", "len"] as const })

         await expect(run({})({})).resolves.toStrictEqual({ len: 1 })
      })
   })

   describe("pure functions", () => {
      it("are callable from indirect inner expressions", async () => {
         const run = createPipeline()
            .addPureFunction("shout", (s: string) => s.toUpperCase())
            .withContextSubject<{ expr: string }>()
            .extendInitial("input", {})
            .withContextSubject<{ s: string }>()
            .addPublicFeature("out", { s: ["input.expr"] as const })
            .buildPipeline({ s: ["out", "s"] as const })

         await expect(
            run({})({ input: { expr: "shout('hi')" } }),
         ).resolves.toStrictEqual({ s: "HI" })
      })
   })

   describe("virtual features", () => {
      it("runs the fulfilling feature in the virtual's slot, so a feature declared in between can consume it", async () => {
         const run = createPipeline()
            .withContextSubject<{ x: string }>()
            .addVirtualFeature("v")
            .withContextSubject<{ k: string }>()
            .addPublicFeature("consumer", {
               k: {
                  method: (x: string) => `${x}!`,
                  selectors: [["v", "x"]] as const,
               },
            })
            .withContextSubject<{ x: string }>()
            .addPublicFeature("v", { x: "'X'" })
            .buildPipeline({ k: ["consumer", "k"] as const })

         await expect(run({})({})).resolves.toStrictEqual({ k: "X!" })
      })

      it("runs a step declared before the fulfillment against the fulfilled value", async () => {
         const run = createPipeline()
            .withContextSubject<{ x: string }>()
            .addVirtualFeature("v")
            .withContextSubject<{ len: number }>()
            .addStep("measure", {
               method: (x: string) => ({ len: x.length }),
               selectors: [["v", "x"]] as const,
            })
            .withContextSubject<{ x: string }>()
            .addPublicFeature("v", { x: "'XYZ'" })
            .buildPipeline({ len: ["measure", "len"] as const })

         await expect(run({})({})).resolves.toStrictEqual({ len: 3 })
      })

      it("prunes method-form dependents of an unfulfilled virtual, cascading to steps, and omits them from the result", async () => {
         const run = createPipeline()
            .withContextSubject<{ x: string }>()
            .addVirtualFeature("v")
            .withContextSubject<{ k: string }>()
            .addPublicFeature("consumer", {
               k: {
                  method: (x: string) => x,
                  selectors: [["v", "x"]] as const,
               },
            })
            .withContextSubject<{ n: number }>()
            .addStep("measure", {
               method: (k: string) => ({ n: k.length }),
               selectors: [["consumer", "k"]] as const,
            })
            .withContextSubject<{ y: string }>()
            .addPublicFeature("independent", { y: "'ok'" })
            .buildPipeline({
               k: ["consumer", "k"] as const,
               n: ["measure", "n"] as const,
               y: ["independent", "y"] as const,
            })

         await expect(run({})({})).resolves.toStrictEqual({ y: "ok" })
      })
   })

   describe("known limitations (pinned current behaviour, see docs/TECH_DEBT.md)", () => {
      it("TD-1: a fulfilling feature that reads a feature declared after the virtual throws at run time", async () => {
         const run = createPipeline()
            .withContextSubject<{ x: string }>()
            .addVirtualFeature("v")
            .withContextSubject<{ y: string }>()
            .addPublicFeature("a", { y: "'A'" })
            .withContextSubject<{ x: string }>()
            .addPublicFeature("v", { x: "a.y" })
            .buildPipeline({ x: ["v", "x"] as const })

         await expect(run({})({})).rejects.toThrow(TypeError)
      })

      it("TD-2: expression-form properties are not pruned, so reading an unfulfilled virtual throws", async () => {
         const run = createPipeline()
            .withContextSubject<{ x: string }>()
            .addVirtualFeature("v")
            .withContextSubject<{ k: string }>()
            .addPublicFeature("consumer", { k: "v.x" })
            .buildPipeline({ k: ["consumer", "k"] as const })

         await expect(run({})({})).rejects.toThrow(TypeError)
      })

      it("TD-3: pure functions are not visible to direct expressions", async () => {
         const run = createPipeline()
            .addPureFunction("shout", (s: string) => s.toUpperCase())
            .withContextSubject<{ s: string }>()
            .addPublicFeature("out", { s: "shout('hi')" })
            .buildPipeline({ s: ["out", "s"] as const })

         await expect(run({})({})).rejects.toThrow("'shout' is not a function")
      })
   })
})
