# Trigram Permutation Gallery

Expands compact permutation specifications into RandomArt rendering tasks for trigram-based galleries (e.g., I Ching hexagrams).

## Quick Start

```bash
# Expand a project spec to tasks
npx tsx src/painting/apps/trigram-permutation/cli/expand-project.ts \
  src/painting/apps/trigram-permutation/examples/bagua-simple.json

# Run tests
npm test -- PermutationExpander.test.ts
```

## Overview

This application demonstrates the middleware architecture by:

1. **Compact specification** - JSON files define permutation logic compactly
2. **Expansion logic** - Converts specs into individual rendering tasks
3. **ULID assignment** - Each task gets a unique, sortable identifier
4. **RegionMap integration** - References IPFS CIDs for rendering configuration

## Project Structure

```
trigram-permutation/
├── models/
│   └── PermutationSpec.ts       # TypeScript interfaces
├── logic/
│   ├── PermutationExpander.ts   # Expansion algorithms
│   └── __tests__/
│       └── PermutationExpander.test.ts
├── cli/
│   └── expand-project.ts        # Command-line tool
├── examples/
│   ├── bagua-simple.json        # 3 trigrams → 3 tasks
│   ├── bagua-full.json          # 8 trigrams → 36 tasks
│   └── prefix-suffix.json       # Prefix/suffix demo
└── README.md
```

## Permutation Types

### 1. Prefix-Suffix (Cartesian Product)

Generates all combinations of prefixes × suffixes.

**Example:**
```json
{
  "expandType": "permutePrefixSuffix",
  "prefixes": ["☰", "☱"],
  "suffixes": ["☰", "☱", "☲"]
}
```

**Output:** `☰☰`, `☰☱`, `☰☲`, `☱☰`, `☱☱`, `☱☲` (6 tasks)

### 2. All-Pairs (Ordered Pairs)

Generates ordered pairs from a single source list.

**Example:**
```json
{
  "expandType": "permuteAllPairs",
  "sources": ["☰", "☱", "☲"],
  "flags": {
    "includeIdentity": false,
    "includeReversals": false
  }
}
```

**Output:** `☰☱`, `☰☲`, `☱☲` (3 tasks - lexicographic order only)

## Flags

### `includeIdentity`

**For PrefixSuffix:** Include cases where prefix === suffix
**For AllPairs:** Include cases like `☰☰`
**Default:** `true` for PrefixSuffix, `false` for AllPairs

### `includeReversals`

**For PrefixSuffix:** N/A (Cartesian product includes all pairs)
**For AllPairs:** Include both `[A,B]` and `[B,A]`
**Default:** `false`

## Examples

### Complete I Ching (64 Hexagrams)

All 8 trigrams with identity, no reversals:

```json
{
  "expandType": "permuteAllPairs",
  "sources": ["☰", "☱", "☲", "☳", "☴", "☵", "☶", "☷"],
  "flags": {
    "includeIdentity": true,
    "includeReversals": false
  }
}
```

**Result:** 8 identity + 28 unique pairs = **36 tasks**

To get all 64 hexagrams, set `includeReversals: true`:

```json
{
  "flags": {
    "includeIdentity": true,
    "includeReversals": true
  }
}
```

**Result:** 8 × 8 = **64 tasks**

### Simple Gallery (No Identity)

Three trigrams, no duplicates:

```json
{
  "expandType": "permuteAllPairs",
  "sources": ["☰", "☱", "☲"],
  "flags": {
    "includeIdentity": false,
    "includeReversals": false
  }
}
```

**Result:** C(3,2) = **3 tasks** (`☰☱`, `☰☲`, `☱☲`)

## CLI Usage

```bash
# Basic usage
npx tsx src/painting/apps/trigram-permutation/cli/expand-project.ts <spec-file.json>

# With JSON output
npx tsx src/painting/apps/trigram-permutation/cli/expand-project.ts \
  examples/bagua-full.json --json

# Count tasks without listing
npx tsx src/painting/apps/trigram-permutation/cli/expand-project.ts \
  examples/bagua-full.json | grep "Total tasks"
```

## Output Format

Each expanded task includes:

- `taskId` - ULID (universally unique, sortable)
- `projectId` - Parent project identifier
- `trigram` - The trigram string (e.g., "☰☱")
- `regionMapCid` - IPFS CID for rendering configuration
- `createdAt` - ISO timestamp

```typescript
{
  taskId: "01KF07Z1BYM7PQ1BMF33T9MAJ9",
  projectId: "bagua-simple-001",
  trigram: "☰☱",
  regionMapCid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
  createdAt: "2026-01-14T12:34:56.789Z"
}
```

## Next Steps

1. **Middleware Integration** - Create middleware extensions for:
   - RegionMapRepository (fetch CID details via Symbol injection)
   - TaskExpansion (expand permutations)
   - ULIDAssignment (generate task IDs)
   - FilePath (ULID-based directory structure)
   - BullMQPayload (prepare for worker submission)

2. **Worker Integration** - Create worker that:
   - Receives serialized task envelope
   - Deserializes with Buffer reconstitution
   - Renders RandomArt image
   - Stores result using middleware filepath

3. **CLI Enhancements**:
   - Submit tasks to BullMQ queue
   - Monitor rendering progress
   - Generate gallery index

## Testing

```bash
# Run all tests
npm test -- PermutationExpander.test.ts

# Run specific test suite
npm test -- PermutationExpander.test.ts -t "expandAllPairs"

# Watch mode
npm test -- PermutationExpander.test.ts --watch
```

All 11 tests passing ✅

## Architecture Notes

This application demonstrates:

- **Clean separation** - Models, logic, CLI layers
- **Type safety** - Full TypeScript with discriminated unions
- **Testability** - Pure functions, no framework dependencies
- **Composability** - Ready for middleware integration
- **Scalability** - Efficient expansion for large galleries

The expansion logic is stateless and suitable for serverless execution.
