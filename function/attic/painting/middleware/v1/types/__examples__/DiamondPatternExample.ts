/**
 * Example demonstrating diamond pattern (multiple inheritance) with dependency injection
 *
 * Shows how ExtensionFactoryV2 handles the diamond problem:
 *
 *        IBase
 *       /     \
 *   IExtOne  IExtTwo
 *       \     /
 *      IExtThree
 *
 * Run with: npx tsx src/painting/middleware/types/__examples__/DiamondPatternExample.ts
 */

import {
   defineExtensionV2,
   DependencyResolver,
} from "../ExtensionFactoryV2.js"

// ============================================================================
// Interface Hierarchy (Logical Inheritance)
// ============================================================================

interface IBase {
   readonly name: string
}

interface IExtOne extends IBase {
   foo(): number
}

interface IExtTwo extends IBase {
   bar(): number
}

interface IExtThree extends IExtOne, IExtTwo {
   biz(): number
}

// ============================================================================
// Base Implementation
// ============================================================================

class _Base implements IBase {
   public readonly name: string = "Base"
}

// ============================================================================
// Extension Implementations (with Dependency Injection)
// ============================================================================

class _ExtOne implements IExtOne {
   constructor(private readonly base: IBase) {}

   get name(): string {
      return this.base.name
   }

   foo(): number {
      console.log(`  ExtOne.foo() called, name=${this.name}`)
      return 5
   }
}

class _ExtTwo implements IExtTwo {
   constructor(private readonly base: IBase) {}

   get name(): string {
      return this.base.name
   }

   bar(): number {
      console.log(`  ExtTwo.bar() called, name=${this.name}`)
      return 3
   }
}

class _ExtThree implements IExtThree {
   constructor(
      private readonly extOne: IExtOne,
      private readonly extTwo: IExtTwo,
   ) {}

   get name(): string {
      return this.extOne.name
   }

   foo(): number {
      return this.extOne.foo()
   }

   bar(): number {
      return this.extTwo.bar()
   }

   biz(): number {
      console.log(`  ExtThree.biz() called, combining foo() + bar()`)
      return this.foo() + this.bar()
   }
}

// ============================================================================
// Define Extensions
// ============================================================================

const ExtOneDef = defineExtensionV2<IBase, _ExtOne, IExtOne>(
   _Base as any,
   _ExtOne,
   ["base"],
   [_Base as any], // Dependency types
)

const ExtTwoDef = defineExtensionV2<IBase, _ExtTwo, IExtTwo>(
   _Base as any,
   _ExtTwo,
   ["base"],
   [_Base as any], // Dependency types
)

const ExtThreeDef = defineExtensionV2<IBase, _ExtThree, IExtThree>(
   _Base as any,
   _ExtThree,
   ["extOne", "extTwo"],
   [_ExtOne, _ExtTwo], // Dependency types for diamond pattern
)

console.log("✓ Extension definitions created")
console.log(`  ExtOne dependencies: ${ExtOneDef.dependencies.paramNames.join(", ")}`)
console.log(`  ExtTwo dependencies: ${ExtTwoDef.dependencies.paramNames.join(", ")}`)
console.log(`  ExtThree dependencies: ${ExtThreeDef.dependencies.paramNames.join(", ")}`)

// ============================================================================
// Build Extension Instances with Dependency Injection
// ============================================================================

console.log("\n--- Building Extension Instances ---")

const resolver = new DependencyResolver()

// 1. Create and register base
const base = new _Base()
resolver.registerBase(_Base as any, base)
console.log("✓ Base instance created and registered")

// 2. Build ExtOne (depends on base)
const extOne = resolver.build(ExtOneDef)
console.log("✓ ExtOne instance built with base dependency")

// 3. Build ExtTwo (depends on same base - idempotent sharing!)
const extTwo = resolver.build(ExtTwoDef)
console.log("✓ ExtTwo instance built with shared base dependency")

// Verify both extensions share the same base
console.log(`\nBase sharing verification:`)
console.log(`  ExtOne.name: ${extOne.name}`)
console.log(`  ExtTwo.name: ${extTwo.name}`)
console.log(`  Same base? ${extOne.name === extTwo.name}`)

// 4. Build ExtThree (depends on both ExtOne and ExtTwo)
// This is the diamond pattern - ExtThree needs both branches
// The resolver now automatically wires dependencies!

console.log("\n--- Building Diamond Extension ---")

// Register ExtOne and ExtTwo so resolver can find them
resolver.registerBase(_ExtOne, extOne)
resolver.registerBase(_ExtTwo, extTwo)
console.log("✓ ExtOne and ExtTwo registered in resolver")

// Now build ExtThree - resolver will automatically inject dependencies
const extThree = resolver.build(ExtThreeDef)
console.log("✓ ExtThree instance built with automatic dependency injection")

// ============================================================================
// Test Diamond Pattern
// ============================================================================

console.log("\n--- Testing Diamond Pattern ---")
console.log("Calling extThree.biz() which uses both foo() and bar():")

const result = extThree.biz()
console.log(`\nResult: ${result}`)
console.log(`Expected: 8 (5 + 3)`)

if (result === 8) {
   console.log("\n✓ Diamond pattern works correctly!")
   console.log("✓ ExtThree successfully uses methods from both ExtOne and ExtTwo")
   console.log("✓ Both branches share the same base instance (idempotent)")
} else {
   console.log("\n✗ Diamond pattern failed")
   process.exit(1)
}

// ============================================================================
// Show the dependency graph
// ============================================================================

console.log("\n--- Dependency Graph ---")
console.log("        IBase (shared)")
console.log("       /           \\")
console.log("   IExtOne      IExtTwo")
console.log("       \\           /")
console.log("        IExtThree")
console.log("")
console.log("Key insights:")
console.log("  1. Interfaces express logical inheritance (TypeScript)")
console.log("  2. Implementations use dependency injection (JavaScript)")
console.log("  3. Single base instance shared across all branches (idempotent)")
console.log("  4. ExtThree can use methods from both ExtOne and ExtTwo")
console.log("  5. No method conflicts - explicit delegation")
