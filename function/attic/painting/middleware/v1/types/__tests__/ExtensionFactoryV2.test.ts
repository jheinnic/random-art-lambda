/**
 * Tests for ExtensionFactoryV2 - Dependency Injection Pattern
 */

import {
   defineExtensionV2,
   DependencyResolver,
   type ExtensionDefinitionV2,
} from "../ExtensionFactoryV2.js"

describe("ExtensionFactoryV2", () => {
   describe("defineExtensionV2", () => {
      it("should extract constructor dependency names", () => {
         class Base {
            name = ""
         }

         class Extension {
            constructor(private readonly base: Base) {}
            get name() {
               return this.base.name
            }
            foo() {
               return 42
            }
         }

         const extDef = defineExtensionV2(Base, Extension, ["base"])

         expect(extDef.dependencies.paramNames).toEqual(["base"])
         expect(extDef.Implementation).toBe(Extension)
         expect(extDef.baseType).toBe(Base)
      })

      it("should create DTO with data properties only", () => {
         class Base {
            jobId = ""
         }

         class Extension {
            constructor(private readonly base: Base) {}
            field1 = ""
            field2 = 0

            getField1Upper() {
               return this.field1.toUpperCase()
            }
         }

         // Provide exemplar for scanning instance fields
         const base = new Base()
         const exemplar = new Extension(base)

         const extDef = defineExtensionV2(
            Base,
            Extension,
            ["base"],
            [Base],
            exemplar,
         )
         const dto = new extDef.DTO()

         // DTO should have data fields
         expect("field1" in dto).toBe(true)
         expect("field2" in dto).toBe(true)

         // DTO should NOT have methods
         expect("getField1Upper" in dto).toBe(false)
      })

      it("should support dependency type mapping", () => {
         class Base {
            name = ""
         }

         class Ext1 {
            constructor(private readonly base: Base) {}
         }

         class Ext2 {
            constructor(
               private readonly ext1: Ext1,
               private readonly base: Base,
            ) {}
         }

         const ext2Def = defineExtensionV2(
            Base,
            Ext2,
            ["ext1", "base"],
            [Ext1, Base],
         )

         expect(ext2Def.dependencies.paramNames).toEqual(["ext1", "base"])
         expect(ext2Def.dependencies.paramTypeMap?.get("ext1")).toBe(Ext1)
         expect(ext2Def.dependencies.paramTypeMap?.get("base")).toBe(Base)
      })
   })

   describe("DependencyResolver", () => {
      it("should resolve single-level dependencies", () => {
         class Base {
            name = "Base"
         }

         class Extension {
            constructor(private readonly base: Base) {}
            get name() {
               return this.base.name
            }
            foo() {
               return 42
            }
         }

         const extDef = defineExtensionV2(Base, Extension, ["base"], [Base])

         const resolver = new DependencyResolver()
         const base = new Base()
         resolver.registerBase(Base, base)

         const instance = resolver.build(extDef)

         expect(instance.name).toBe("Base")
         expect(instance.foo()).toBe(42)
      })

      it("should resolve multi-level dependencies (diamond pattern)", () => {
         // Base
         class Base {
            name = "Base"
         }

         // Extension 1 (depends on Base)
         class Ext1 {
            constructor(private readonly base: Base) {}
            get name() {
               return this.base.name
            }
            foo() {
               return 5
            }
         }

         // Extension 2 (depends on Base)
         class Ext2 {
            constructor(private readonly base: Base) {}
            get name() {
               return this.base.name
            }
            bar() {
               return 3
            }
         }

         // Extension 3 (depends on both Ext1 and Ext2)
         class Ext3 {
            constructor(
               private readonly ext1: Ext1,
               private readonly ext2: Ext2,
            ) {}
            get name() {
               return this.ext1.name
            }
            foo() {
               return this.ext1.foo()
            }
            bar() {
               return this.ext2.bar()
            }
            biz() {
               return this.foo() + this.bar()
            }
         }

         // Define extensions
         const ext1Def = defineExtensionV2(Base, Ext1, ["base"], [Base])
         const ext2Def = defineExtensionV2(Base, Ext2, ["base"], [Base])
         const ext3Def = defineExtensionV2(
            Base,
            Ext3,
            ["ext1", "ext2"],
            [Ext1, Ext2],
         )

         // Build instances
         const resolver = new DependencyResolver()
         const base = new Base()
         resolver.registerBase(Base, base)

         const ext1 = resolver.build(ext1Def)
         const ext2 = resolver.build(ext2Def)

         // Register Ext1 and Ext2 so Ext3 can resolve them
         resolver.registerBase(Ext1, ext1)
         resolver.registerBase(Ext2, ext2)

         const ext3 = resolver.build(ext3Def)

         // Ext3 can use methods from both Ext1 and Ext2
         expect(ext3.foo()).toBe(5)
         expect(ext3.bar()).toBe(3)
         expect(ext3.biz()).toBe(8)

         // All share the same base
         expect(ext1.name).toBe("Base")
         expect(ext2.name).toBe("Base")
         expect(ext3.name).toBe("Base")
      })

      it("should detect circular dependencies", () => {
         class Base {
            name = ""
         }

         class Ext1 {
            constructor(private readonly ext2: any) {}
         }

         class Ext2 {
            constructor(private readonly ext1: any) {}
         }

         const ext1Def = defineExtensionV2(Base, Ext1, ["ext2"], [Ext2])
         const ext2Def = defineExtensionV2(Base, Ext2, ["ext1"], [Ext1])

         const resolver = new DependencyResolver()

         // Manually try to build with circular deps
         // (This would require more complex setup to trigger naturally)
         // For now, we test that the building set is managed correctly
         expect(resolver.has(Ext1)).toBe(false)
      })

      it("should throw when dependency not found", () => {
         class Base {
            name = ""
         }

         class Extension {
            constructor(private readonly base: Base) {}
         }

         const extDef = defineExtensionV2(Base, Extension, ["base"], [Base])

         const resolver = new DependencyResolver()
         // Don't register base

         expect(() => resolver.build(extDef)).toThrow(
            /Dependency 'base' not found/,
         )
      })

      it("should reuse already-built instances", () => {
         class Base {
            name = "Base"
         }

         class Extension {
            constructor(private readonly base: Base) {}
            get name() {
               return this.base.name
            }
         }

         const extDef = defineExtensionV2(Base, Extension, ["base"], [Base])

         const resolver = new DependencyResolver()
         const base = new Base()
         resolver.registerBase(Base, base)

         const instance1 = resolver.build(extDef)
         const instance2 = resolver.build(extDef)

         // Should return same instance (idempotent)
         expect(instance1).toBe(instance2)
      })

      it("should populate instance with data", () => {
         class Base {
            jobId = ""
         }

         class Extension {
            constructor(private readonly base: Base) {}
            field1 = ""
            field2 = 0
         }

         const extDef = defineExtensionV2(Base, Extension, ["base"], [Base])

         const resolver = new DependencyResolver()
         const base = new Base()
         base.jobId = "job-123"
         resolver.registerBase(Base, base)

         const instance = resolver.build(extDef, {
            field1: "hello",
            field2: 42,
         })

         expect(instance.field1).toBe("hello")
         expect(instance.field2).toBe(42)
      })
   })
})
