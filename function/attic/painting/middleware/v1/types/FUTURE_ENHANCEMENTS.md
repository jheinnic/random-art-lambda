# Future Enhancement Reference

## Symbol-Based Namespace Isolation

**Status**: Available if needed (ExtensionFactory already supports it)

**Use case**: When multiple extensions might have naming conflicts

```typescript
// Extension A
export const storagePathKey = Symbol('storagePath')
class StorageExtension {
   [storagePathKey]: string = ""
}

// Extension B - no conflict!
export const storagePathKey = Symbol('storagePath')
class CacheExtension {
   [storagePathKey]: string = ""
}
```

The factory's `Object.keys()` and `Reflect.ownKeys()` already extract symbol properties.

## Advanced Conflict Resolution

**Reference**: `/tmp/portfolio-monorepo/packages/mixins` (features/bootstrap branch)

**Patterns from prior work**:
- **Replacing**: Last-wins (we already do this)
- **Reducing**: Combine results from multiple methods `(baseValue, mixinValue) => combined`
- **Chaining**: Call methods in sequence, threading results

**When to revisit**: If we need to merge multiple extensions that define the same method name (e.g., middleware lifecycle hooks like `init()` or `cleanup()`)

## Decorator-Based Discovery

**Reference**: `@mixable`, `@nomixin` decorators in portfolio-monorepo

**When to revisit**: If we build a plugin system where extensions are discovered at runtime rather than composed explicitly at configuration time

## Extension Point Registry

**Reference**: Attic'd NestJS ExtensionPoints module

**When to revisit**: If we need partial strategy registration or dynamic plugin loading

---

**Current decision**: ExtensionFactory is complete for current needs. Next step is Builder pattern integration, not feature additions.
