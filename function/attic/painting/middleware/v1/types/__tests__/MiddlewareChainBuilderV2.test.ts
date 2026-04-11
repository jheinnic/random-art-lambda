/**
 * Tests for MiddlewareChainBuilderV2 - Dependency Injection Pattern
 */

import { defineExtensionV2 } from "../ExtensionFactoryV2.js"
import { MiddlewareChainBuilderV2 } from "../MiddlewareChainBuilderV2.js"
import { MiddlewareHandler } from "../MiddlewareHandler.js"
import { MiddlewareResult } from "../MiddlewareResult.js"
import { JobDisposition } from "../JobDisposition.js"

describe("MiddlewareChainBuilderV2", () => {
   it("should execute middleware chain with dependency injection", async () => {
      // Base model
      class BaseModel {
         jobId = ""
         buffer = Buffer.from("")
      }

      // Extension 1 (no dependencies beyond base)
      class _Extension1 {
         constructor(private readonly base: BaseModel) {}
         field1 = ""
         getField1Upper() {
            return this.field1.toUpperCase()
         }
      }

      const Ext1 = defineExtensionV2(
         BaseModel,
         _Extension1 as any,
         ["base"],
         [BaseModel],
      )

      // Extension 2 (depends on Extension1)
      class _Extension2 {
         constructor(
            private readonly base: BaseModel,
            private readonly ext1: _Extension1,
         ) {}
         field2 = 0
         getField2Doubled() {
            return this.field2 * 2
         }
         getCombined() {
            // Uses injected ext1 dependency
            return `${this.ext1.getField1Upper()}-${this.field2}`
         }
      }

      const Ext2 = defineExtensionV2(
         BaseModel,
         _Extension2 as any,
         ["base", "ext1"],
         [BaseModel, _Extension1],
      )

      // Handlers
      class Handler1 implements MiddlewareHandler<any, undefined> {
         async handle(ctx: any): Promise<MiddlewareResult<any, undefined>> {
            return {
               model: { field1: "hello" },
               disposition: JobDisposition.OK,
            }
         }
      }

      class Handler2 implements MiddlewareHandler<any, undefined> {
         async handle(ctx: any): Promise<MiddlewareResult<any, undefined>> {
            // Can access field1 from previous step via super-delegate
            expect(ctx.field1).toBe("hello")
            expect(ctx.getField1Upper()).toBe("HELLO")

            return {
               model: { field2: 42 },
               disposition: JobDisposition.OK,
            }
         }
      }

      // Build and execute chain
      const base = new BaseModel()
      base.buffer = Buffer.from("test")
      base.jobId = "job-123"

      const result = await new MiddlewareChainBuilderV2(base, BaseModel)
         .add(Ext1 as any, new Handler1())
         .add(Ext2 as any, new Handler2())
         .execute()

      // Result has all properties and methods
      expect((result as any).jobId).toBe("job-123")
      expect((result as any).field1).toBe("hello")
      expect((result as any).field2).toBe(42)
      expect((result as any).getField1Upper()).toBe("HELLO")
      expect((result as any).getField2Doubled()).toBe(84)
      // Extension 2 can call Extension 1's methods via DI
      expect((result as any).getCombined()).toBe("HELLO-42")
   })

   it("should stop on non-OK disposition", async () => {
      class BaseModel {
         jobId = ""
      }

      class Extension1 {
         constructor(private readonly base: BaseModel) {}
         field1 = ""
      }

      const Ext1 = defineExtensionV2(
         BaseModel,
         Extension1 as any,
         ["base"],
         [BaseModel],
      )

      class Extension2 {
         constructor(private readonly base: BaseModel) {}
         field2 = ""
      }

      const Ext2 = defineExtensionV2(
         BaseModel,
         Extension2 as any,
         ["base"],
         [BaseModel],
      )

      class Handler1 implements MiddlewareHandler<any, undefined> {
         async handle(): Promise<MiddlewareResult<any, undefined>> {
            return {
               disposition: JobDisposition.FATAL_ERROR,
               error: new Error("Fatal error"),
            }
         }
      }

      class Handler2 implements MiddlewareHandler<any, undefined> {
         async handle(): Promise<MiddlewareResult<any, undefined>> {
            // Should not be called
            throw new Error("Handler2 should not be called")
         }
      }

      const base = new BaseModel()
      base.jobId = "job-456"

      const result = await new MiddlewareChainBuilderV2(base, BaseModel)
         .add(Ext1 as any, new Handler1())
         .add(Ext2 as any, new Handler2())
         .execute()

      expect((result as any).disposition).toBe(JobDisposition.FATAL_ERROR)
      expect((result as any).error).toBeInstanceOf(Error)
      expect((result as any).error.message).toBe("Fatal error")
   })

   it("should support linear dependency chain", async () => {
      class Base {
         prefix = "base"
      }

      // Ext1 depends on Base
      class Ext1 {
         constructor(private readonly base: Base) {}
         suffix1 = "-ext1"
         getValue1() {
            return this.base.prefix + this.suffix1
         }
      }

      const Ext1Def = defineExtensionV2(Base, Ext1 as any, ["base"], [Base])

      // Ext2 depends on Base and Ext1
      class Ext2 {
         constructor(
            private readonly base: Base,
            private readonly ext1: Ext1,
         ) {}
         suffix2 = "-ext2"
         getValue2() {
            // Uses injected ext1 dependency
            return this.ext1.getValue1() + this.suffix2
         }
      }

      const Ext2Def = defineExtensionV2(
         Base,
         Ext2 as any,
         ["base", "ext1"],
         [Base, Ext1],
      )

      // Ext3 depends on Base, Ext1, and Ext2
      class Ext3 {
         constructor(
            private readonly base: Base,
            private readonly ext1: Ext1,
            private readonly ext2: Ext2,
         ) {}
         suffix3 = "-ext3"
         getValue3() {
            // Uses injected ext2 dependency
            return this.ext2.getValue2() + this.suffix3
         }
      }

      const Ext3Def = defineExtensionV2(
         Base,
         Ext3 as any,
         ["base", "ext1", "ext2"],
         [Base, Ext1, Ext2],
      )

      class Handler1 implements MiddlewareHandler<any, undefined> {
         async handle(): Promise<MiddlewareResult<any, undefined>> {
            return {
               model: { suffix1: "-one" },
               disposition: JobDisposition.OK,
            }
         }
      }

      class Handler2 implements MiddlewareHandler<any, undefined> {
         async handle(): Promise<MiddlewareResult<any, undefined>> {
            return {
               model: { suffix2: "-two" },
               disposition: JobDisposition.OK,
            }
         }
      }

      class Handler3 implements MiddlewareHandler<any, undefined> {
         async handle(): Promise<MiddlewareResult<any, undefined>> {
            return {
               model: { suffix3: "-three" },
               disposition: JobDisposition.OK,
            }
         }
      }

      const base = new Base()
      base.prefix = "start"

      const result = await new MiddlewareChainBuilderV2(base, Base)
         .add(Ext1Def as any, new Handler1())
         .add(Ext2Def as any, new Handler2())
         .add(Ext3Def as any, new Handler3())
         .execute()

      // Each extension can call previous extensions' methods via DI
      expect((result as any).getValue1()).toBe("start-one")
      expect((result as any).getValue2()).toBe("start-one-two")
      expect((result as any).getValue3()).toBe("start-one-two-three")
   })
})
