/**
 * Manual verification of ExtensionFactory
 *
 * Run with: npx ts-node src/painting/middleware/types/__examples__/ExtensionFactoryManualTest.ts
 */

import { defineExtension, createDelegate } from "../ExtensionFactory.js"

// Base model
class BaseModel {
   baseId: string = ""
   baseValue: number = 0
}

// Extension written naturally
class TestExtension extends BaseModel {
   // Data properties
   dataField1: string = ""
   dataField2: number = 0

   // Methods that call each other
   getDataField1Upper(): string {
      return this.dataField1.toUpperCase()
   }

   getDataField2Doubled(): number {
      return this.dataField2 * 2
   }

   getCombined(): string {
      return `${this.getDataField1Upper()}_${this.getDataField2Doubled()}`
   }
}

// Decompose
const TestDef = defineExtension(BaseModel, TestExtension as any)

console.log("✓ Extension decomposed successfully")
console.log(`  DTO name: ${TestDef.DTO.name}`)
console.log(`  Extension name: ${(TestDef.Extension as any).name}`)
console.log(`  Delegate name: ${TestDef.Delegate.name}`)

// Create instances
const base = new BaseModel()
base.baseId = "test-123"
base.baseValue = 42

const dto = new TestDef.DTO() as any
dto.dataField1 = "hello"
dto.dataField2 = 5

console.log("\n✓ Created base and DTO instances")
console.log(`  Base: ${JSON.stringify(base)}`)
console.log(`  DTO: ${JSON.stringify(dto)}`)

// Create delegate
const delegate = createDelegate(base, dto, TestDef.Extension) as any

console.log("\n✓ Created delegate proxy")

// Test access to base properties
console.log(`\n  Base properties:`)
console.log(`    delegate.baseId = "${delegate.baseId}"`)
console.log(`    delegate.baseValue = ${delegate.baseValue}`)

// Test access to DTO properties
console.log(`\n  DTO properties:`)
console.log(`    delegate.dataField1 = "${delegate.dataField1}"`)
console.log(`    delegate.dataField2 = ${delegate.dataField2}`)

// Test extension methods
console.log(`\n  Extension methods:`)
console.log(`    delegate.getDataField1Upper() = "${delegate.getDataField1Upper()}"`)
console.log(`    delegate.getDataField2Doubled() = ${delegate.getDataField2Doubled()}`)
console.log(`    delegate.getCombined() = "${delegate.getCombined()}"`)

// Verify methods can call each other
if (delegate.getCombined() === "HELLO_10") {
   console.log("\n✓ Methods successfully call each other via `this`")
} else {
   console.log("\n✗ Method chaining failed")
   process.exit(1)
}

console.log("\n✓ All tests passed!")
console.log("\nThe ExtensionFactory successfully:")
console.log("  1. Decomposed a class into DTO + Extension + Delegate")
console.log("  2. Created a unified delegate proxy")
console.log("  3. Enabled methods to call each other via `this`")
console.log("  4. Provided transparent access to all three layers")
