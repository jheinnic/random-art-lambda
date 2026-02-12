# Archived V1/V2 Middleware Architecture

This directory contains the **deprecated** V1 and V2 middleware architectures, archived for historical reference.

## Why Archived?

V1 and V2 have been superseded by **V3**, which uses TypeScript's native declaration merging instead of custom infrastructure.

### Problems with V1/V2

**V1 (Implicit Dependencies)**:
- Non-deterministic initialization order
- No type safety for cross-extension calls
- Runtime errors if extensions load in wrong order

**V2 (Dependency Injection)**:
- Framework lock-in (can't test without DI system)
- Complex infrastructure (~600 lines)
- Awkward development flow
- Over-engineered solution to problems TypeScript already solves

### V3 Solution

The current production architecture (V3) uses:
- **TypeScript declaration merging** (native, no framework)
- **Symbol properties** (clean serialization)
- **Prototype methods** (behavior without serialization)
- **~50 lines of infrastructure** vs ~600 in V2

See: `../function/src/painting/middleware/types/__examples__/`

## What's Here

### V1 Files
- `ExtensionFactory.ts` - Original extension factory (implicit dependencies)
- `MiddlewareChainBuilder.ts` - Original builder
- `ExtensionFactory.test.ts` - V1 tests
- `MiddlewareChainBuilder.test.ts` - V1 builder tests
- `ExtensionFactoryExample.DEPRECATED.ts` - Deprecated V1 example
- `MiddlewareChainBuilderExample.ts` - V1 builder example

### V2 Files
- `ExtensionFactoryV2.ts` - DI-based extension factory
- `MiddlewareChainBuilderV2.ts` - DI-aware builder
- `DependencyResolver.ts` - Dependency injection system
- `ExtensionFactoryV2.test.ts` - V2 tests
- `MiddlewareChainBuilderV2.test.ts` - V2 builder tests
- `MiddlewareChainBuilderV2Example.ts` - V2 builder example
- `DiamondPatternExample.ts` - Diamond inheritance with DI
- `V2_ARCHITECTURE.md` - V2 documentation

### Test/Example Files
- `BranchingInheritanceTest.ts` - Inheritance patterns
- `MultiLevelInheritanceTest.ts` - Multi-level inheritance
- `ExtensionFactoryManualTest.ts` - Manual testing harness

## Migration to V3

If you need to migrate V1/V2 code to V3, see:

```
../function/src/painting/middleware/types/__examples__/COMPARISON.md
```

This document shows side-by-side comparisons and migration paths.

## Key Lesson

**Don't build infrastructure that TypeScript already provides.**

V1/V2 tried to solve:
- Type safety → TypeScript has declaration merging
- Dependency validation → TypeScript has import order
- Composition → JavaScript has prototypes
- Non-serializable state → JavaScript has Symbols

V3 embraces these native features instead of fighting them.

## Archived Date

January 14, 2026

## Reference

For the current production architecture, see:
- `../function/src/painting/middleware/types/__examples__/README.md`
- `../function/src/painting/middleware/types/__examples__/V3_ARCHITECTURE.md`
