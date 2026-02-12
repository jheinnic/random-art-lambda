/**
 * Tests for ExtensionFactory - runtime validation
 */

import { defineExtension, createDelegate } from "../ExtensionFactory.js"

describe("ExtensionFactory", () => {
   it("should decompose a class into DTO, Extension, and Delegate", () => {
      //  Define test types inline
      const BaseModel = class {
         baseId = ""
         baseValue = 0
      }

      class TestExtension extends BaseModel {
         dataField1 = ""
         dataField2 = 0

         getDataField1Upper() {
            return this.dataField1.toUpperCase()
         }

         getDataField2Doubled() {
            return this.dataField2 * 2
         }

         getCombined() {
            return `${this.getDataField1Upper()}_${this.getDataField2Doubled()}`
         }
      }

      // Decompose
      const TestDef = defineExtension(BaseModel as any, TestExtension as any)

      // DTO should have only data properties
      const dto = new TestDef.DTO() as any
      expect(dto).toHaveProperty("dataField1")
      expect(dto).toHaveProperty("dataField2")
      expect(dto).not.toHaveProperty("getDataField1Upper")

      // Extension should have static methods
      expect(typeof (TestDef.Extension as any).getDataField1Upper).toBe(
         "function",
      )
      expect(typeof (TestDef.Extension as any).getCombined).toBe("function")

      // Names should be preserved
      expect(TestDef.DTO.name).toBe("TestExtension_DTO")
      expect((TestDef.Extension as any).name).toBe("TestExtension_Extension")
   })

   it("should create a working delegate with unified context", () => {
      const BaseModel = class {
         baseId = ""
         baseValue = 0
      }

      class TestExtension extends BaseModel {
         dataField1 = ""
         dataField2 = 0

         getDataField1Upper() {
            return this.dataField1.toUpperCase()
         }

         getCombined() {
            return `${this.getDataField1Upper()}_${this.dataField2}`
         }
      }

      const TestDef = defineExtension(BaseModel as any, TestExtension as any)

      // Create instances
      const base = new BaseModel()
      base.baseId = "test-123"
      base.baseValue = 42

      const dto = new TestDef.DTO() as any
      dto.dataField1 = "hello"
      dto.dataField2 = 5

      // Create delegate
      const delegate = createDelegate(base, dto, TestDef.Extension) as any

      // Should have base properties
      expect(delegate.baseId).toBe("test-123")
      expect(delegate.baseValue).toBe(42)

      // Should have DTO properties
      expect(delegate.dataField1).toBe("hello")
      expect(delegate.dataField2).toBe(5)

      // Should have extension methods
      expect(typeof delegate.getDataField1Upper).toBe("function")
      expect(typeof delegate.getCombined).toBe("function")

      // Methods should work
      expect(delegate.getDataField1Upper()).toBe("HELLO")

      // Methods should be able to call each other via `this`
      expect(delegate.getCombined()).toBe("HELLO_5")
   })

   it("should work with a campaign extension example", () => {
      const TaskBase = class {
         buffer = Buffer.from("")
         jobId = ""
      }

      class CampaignExtension extends TaskBase {
         campaignName = ""
         seedValue = 0

         getCampaignKey() {
            return `${this.campaignName}_${this.seedValue}`
         }

         getFilename() {
            return `${this.getCampaignKey()}.png`
         }
      }

      const Campaign = defineExtension(TaskBase as any, CampaignExtension as any)

      // Create instances
      const base = new TaskBase()
      base.buffer = Buffer.from("test")
      base.jobId = "job-456"

      const dto = new Campaign.DTO() as any
      dto.campaignName = "summer2024"
      dto.seedValue = 42

      // Create delegate
      const delegate = createDelegate(base, dto, Campaign.Extension) as any

      // Verify unified context
      expect(delegate.jobId).toBe("job-456")
      expect(delegate.campaignName).toBe("summer2024")
      expect(delegate.getCampaignKey()).toBe("summer2024_42")
      expect(delegate.getFilename()).toBe("summer2024_42.png")
   })
})
