# Attic - Shelved Code (2025)

This directory contains code that was part of an earlier architectural exploration but is no longer used in the main codebase. The code is preserved for historical reference and potential future reuse.

## What's Here

### Extension Points System (`extensions/`)
A sophisticated TypeScript plugin architecture providing compile-time type safety for extensible systems. Includes:
- Extension point definitions with type-level hooks
- Adapter pattern for wrapping extensions
- Runtime orchestration via ExtensionWrangler

**Why shelved:** Over-engineered for current needs. The painting module doesn't require runtime plugin extensibility.

### Message Serialization (`messages/`)
Advanced type mapping and wire protocol system for serializing complex objects:
- WireCodecAdapter - Generic transformation engine
- Type mapping extensions - Pluggable converters (CID→string, Uint32Array→base64)
- SerializationProxyHandler - ES6 Proxy-based serialization

**Why shelved:** Not used in production. Simple `Codec.ts` handles current serialization needs.

### Seeding Extensions (`seeding/`)
Extensible seed type system for generative art models:
- GenModelSeedExtensionPoint - Plugin architecture for seed types
- Built-in extensions (PhraseSeed, HexSeed)
- Conversion to standard PaintableSeed format

**Why shelved:** Current implementation uses `SeedModelStrategy` discriminated union directly without extension mechanism.

## Migration Notes

When shelved, the following references were removed:
- `src/painting/artwork/di/Module.ts` - Removed `InjectedGenModelSeedExtensionPoint` injection
- `src/painting/artwork/di/Types.ts` - Removed extension point type definition

## Potential Future Use

This code may be valuable if:
1. **Extension points**: Need runtime plugin architecture for custom painting algorithms
2. **Message serialization**: Require sophisticated type transformations for external API integration
3. **Seeding extensions**: Want to support user-defined seed formats beyond current types

## Related

See `/atticV1/` for earlier generation of shelved code.
