/**
 * Test multi-level inheritance (3-4 levels deep)
 *
 * Run with: npx tsx src/painting/middleware/types/__examples__/MultiLevelInheritanceTest.ts
 */

import { defineExtension, createDelegate } from "../ExtensionFactory.js"

// Base model (level 0)
class BaseModel {
   baseId: string = ""
   baseValue: number = 0
}

// Level 1 extension
class Level1Extension extends BaseModel {
   // Level 1 data
   level1Field: string = ""

   // Level 1 method
   getLevel1(): string {
      return `L1:${this.level1Field}`
   }
}

// Level 2 extension (extends Level 1)
class Level2Extension extends Level1Extension {
   // Level 2 data
   level2Field: number = 0

   // Level 2 method that calls Level 1 method
   getLevel2(): string {
      return `L2:${this.level2Field}-${this.getLevel1()}`
   }
}

// Level 3 extension (extends Level 2)
class Level3Extension extends Level2Extension {
   // Level 3 data
   level3Field: boolean = false

   // Level 3 method that calls Level 2 method
   getLevel3(): string {
      return `L3:${this.level3Field}-${this.getLevel2()}`
   }
}

// Level 4 extension (extends Level 3)
class Level4Extension extends Level3Extension {
   // Level 4 data
   level4Field: string[] = []

   // Level 4 method that calls Level 3 method
   getLevel4(): string {
      return `L4:[${this.level4Field.join(",")}]-${this.getLevel3()}`
   }

   // Method that accesses all levels
   getAllLevels(): string {
      return [
         `Base: ${this.baseId}=${this.baseValue}`,
         `L1: ${this.level1Field}`,
         `L2: ${this.level2Field}`,
         `L3: ${this.level3Field}`,
         `L4: [${this.level4Field.join(",")}]`,
      ].join(" | ")
   }
}

// Decompose Level 4 (should include all ancestor properties and methods)
const Level4Def = defineExtension(BaseModel, Level4Extension as any)

console.log("✓ Multi-level extension decomposed successfully")
console.log(`  DTO name: ${Level4Def.DTO.name}`)
console.log(`  Extension name: ${(Level4Def.Extension as any).name}`)

// Create instances
const base = new BaseModel()
base.baseId = "test-456"
base.baseValue = 99

const dto = new Level4Def.DTO() as any
dto.level1Field = "alpha"
dto.level2Field = 42
dto.level3Field = true
dto.level4Field = ["foo", "bar", "baz"]

console.log("\n✓ Created base and DTO instances")
console.log(`  Base: ${JSON.stringify(base)}`)
console.log(`  DTO: ${JSON.stringify(dto)}`)

// Create delegate
const delegate = createDelegate(base, dto, Level4Def.Extension) as any

console.log("\n✓ Created delegate proxy")

// Test access to all levels
console.log(`\n  Base properties:`)
console.log(`    delegate.baseId = "${delegate.baseId}"`)
console.log(`    delegate.baseValue = ${delegate.baseValue}`)

console.log(`\n  Level 1 properties and methods:`)
console.log(`    delegate.level1Field = "${delegate.level1Field}"`)
console.log(`    delegate.getLevel1() = "${delegate.getLevel1()}"`)

console.log(`\n  Level 2 properties and methods:`)
console.log(`    delegate.level2Field = ${delegate.level2Field}`)
console.log(`    delegate.getLevel2() = "${delegate.getLevel2()}"`)

console.log(`\n  Level 3 properties and methods:`)
console.log(`    delegate.level3Field = ${delegate.level3Field}`)
console.log(`    delegate.getLevel3() = "${delegate.getLevel3()}"`)

console.log(`\n  Level 4 properties and methods:`)
console.log(`    delegate.level4Field = [${delegate.level4Field.join(",")}]`)
console.log(`    delegate.getLevel4() = "${delegate.getLevel4()}"`)

console.log(`\n  Unified access across all levels:`)
console.log(`    delegate.getAllLevels() = "${delegate.getAllLevels()}"`)

// Verify expected outputs
const expectedLevel4 = "L4:[foo,bar,baz]-L3:true-L2:42-L1:alpha"
const expectedAll =
   "Base: test-456=99 | L1: alpha | L2: 42 | L3: true | L4: [foo,bar,baz]"

if (delegate.getLevel4() === expectedLevel4) {
   console.log("\n✓ Method chaining across all 4 levels works correctly")
} else {
   console.log(
      `\n✗ Method chaining failed: expected "${expectedLevel4}", got "${delegate.getLevel4()}"`,
   )
   process.exit(1)
}

if (delegate.getAllLevels() === expectedAll) {
   console.log("✓ Unified access to all properties works correctly")
} else {
   console.log(
      `\n✗ Unified access failed: expected "${expectedAll}", got "${delegate.getAllLevels()}"`,
   )
   process.exit(1)
}

console.log("\n✓ All multi-level inheritance tests passed!")
console.log("\nThe ExtensionFactory successfully handles:")
console.log("  1. 4 levels of inheritance (Base → L1 → L2 → L3 → L4)")
console.log("  2. Properties from all ancestor classes")
console.log("  3. Methods from all ancestor classes")
console.log("  4. Method chaining across inheritance levels")
console.log("  5. Unified access to all layers via delegate proxy")
