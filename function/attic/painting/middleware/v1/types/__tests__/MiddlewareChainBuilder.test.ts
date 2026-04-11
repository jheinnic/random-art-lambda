/**
 * Tests for MiddlewareChainBuilder - intersection type accumulation
 */

import { defineExtension } from "../ExtensionFactory.js"
import { MiddlewareChainBuilder } from "../MiddlewareChainBuilder.js"
import { MiddlewareHandler } from "../MiddlewareHandler.js"
import { MiddlewareResult } from "../MiddlewareResult.js"
import { JobDisposition } from "../JobDisposition.js"

describe("MiddlewareChainBuilder", () => {
   it("should accumulate extensions via intersection types", async () => {
      // Base model
      const BaseModel = class {
         buffer = Buffer.from("")
         jobId = ""
      }

      // Extension 1
      class Extension1 extends BaseModel {
         field1 = ""
         getField1Upper() {
            return this.field1.toUpperCase()
         }
      }
      const Ext1 = defineExtension(BaseModel as any, Extension1 as any)

      // Extension 2
      class Extension2 extends BaseModel {
         field2 = 0
         getField2Doubled() {
            return this.field2 * 2
         }
      }
      const Ext2 = defineExtension(BaseModel as any, Extension2 as any)

      // Middleware handlers
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
            // Can access field1 from previous step
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

      const result = await new MiddlewareChainBuilder(base)
         .add(Ext1 as any, new Handler1())
         .add(Ext2 as any, new Handler2())
         .execute()

      // Result has all properties and methods
      expect((result as any).jobId).toBe("job-123")
      expect((result as any).field1).toBe("hello")
      expect((result as any).field2).toBe(42)
      expect((result as any).getField1Upper()).toBe("HELLO")
      expect((result as any).getField2Doubled()).toBe(84)
   })

   it("should stop on non-OK disposition", async () => {
      const BaseModel = class {
         jobId = ""
      }

      class Extension1 extends BaseModel {
         field1 = ""
      }
      const Ext1 = defineExtension(BaseModel as any, Extension1 as any)

      class Extension2 extends BaseModel {
         field2 = ""
      }
      const Ext2 = defineExtension(BaseModel as any, Extension2 as any)

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

      const result = await new MiddlewareChainBuilder(base)
         .add(Ext1 as any, new Handler1())
         .add(Ext2 as any, new Handler2())
         .execute()

      expect((result as any).disposition).toBe(JobDisposition.FATAL_ERROR)
      expect((result as any).error).toBeInstanceOf(Error)
      expect((result as any).error.message).toBe("Fatal error")
   })

   it("should support method chaining across extensions", async () => {
      const BaseModel = class {
         prefix = ""
      }

      // Extension 1: Add name
      class NameExtension extends BaseModel {
         name = ""
         getFullName() {
            return `${this.prefix}-${this.name}`
         }
      }
      const Name = defineExtension(BaseModel as any, NameExtension as any)

      // Extension 2: Add suffix using Extension 1's method
      class SuffixExtension extends BaseModel {
         suffix = ""
         getFullNameWithSuffix() {
            // This calls getFullName() from Extension 1!
            // TypeScript doesn't know about it, but runtime will work
            return `${(this as any).getFullName()}-${this.suffix}`
         }
      }
      const Suffix = defineExtension(BaseModel as any, SuffixExtension as any)

      class NameHandler implements MiddlewareHandler<any, undefined> {
         async handle(): Promise<MiddlewareResult<any, undefined>> {
            return {
               model: { name: "foo" },
               disposition: JobDisposition.OK,
            }
         }
      }

      class SuffixHandler implements MiddlewareHandler<any, undefined> {
         async handle(): Promise<MiddlewareResult<any, undefined>> {
            return {
               model: { suffix: "bar" },
               disposition: JobDisposition.OK,
            }
         }
      }

      const base = new BaseModel()
      base.prefix = "pre"

      const result = await new MiddlewareChainBuilder(base)
         .add(Name as any, new NameHandler())
         .add(Suffix as any, new SuffixHandler())
         .execute()

      // Methods from different extensions can call each other!
      expect((result as any).getFullName()).toBe("pre-foo")
      expect((result as any).getFullNameWithSuffix()).toBe("pre-foo-bar")
   })
})
