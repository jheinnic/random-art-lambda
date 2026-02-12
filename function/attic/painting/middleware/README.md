# Attic - Archived Code

This directory contains code that was abandoned or superseded during development.
Files here are preserved for reference but are not part of the active codebase.

## Why files end up here

- **Broken imports/types**: Code that doesn't compile due to removed dependencies
- **Abandoned concepts**: Features that were explored but not pursued
- **Superseded patterns**: Old approaches replaced by better abstractions

## Contents

### components/
- `DoThing.ts` - Early pipeline concept with undefined types (Renderer, Extend, etc.)
- `Pipeline.ts` - Another pipeline attempt with undefined Extend type

### expression/
- `BuiltInFunctions.ts` - Expression functions referencing non-existent `canvas` property on BaseTaskModel

### handlers/
- `CacheRenderedImageMiddleware.ts` - LRU cache concept that was abandoned; replaced by ActivityUnit-based staging

### di/
- `ExampleCacheIntegration.ts` - Example using removed `createCacheAccessFunctions` export

### __examples__/
- Example code for the type extension system (PipelineContext, extensions, etc.)

## Resurrection

If you need to bring something back:
1. Copy the file to its original location
2. Fix any broken imports/types
3. Update the relevant index.ts exports
4. Remove from attic

Do not import directly from attic/ - these files may not compile.
