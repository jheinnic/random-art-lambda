/**
 * Context Part Registry
 *
 * Maintains a registry of all context parts and provides validation
 * to ensure abstract dependencies are satisfied before assembly.
 */

import {
   type ContextPartMetadata,
   type ContextPartConstructor,
   type ContextPartRef,
   getContextPartMetadata,
   CONTEXT_PART_METADATA,
} from "./ContextPartMetadata.js"

// ============================================================================
// Assembly Validation Types
// ============================================================================

/**
 * Result of validating a set of parts for assembly
 */
export interface AssemblyValidationResult {
   /** Whether the assembly is valid */
   readonly isValid: boolean
   /** List of validation errors (if any) */
   readonly errors: AssemblyValidationError[]
   /** The resolved dependency graph */
   readonly dependencyGraph: DependencyGraph
}

/**
 * Types of validation errors
 */
export enum ValidationErrorType {
   /** An abstract dependency has no provider */
   MISSING_PROVIDER = "missing_provider",
   /** An abstract dependency has multiple providers */
   DUPLICATE_PROVIDER = "duplicate_provider",
   /** Circular dependency detected */
   CIRCULAR_DEPENDENCY = "circular_dependency",
   /** Part references unknown dependency */
   UNKNOWN_DEPENDENCY = "unknown_dependency",
   /** Abstract part cannot be directly assembled */
   ABSTRACT_IN_ASSEMBLY = "abstract_in_assembly",
}

/**
 * A validation error
 */
export interface AssemblyValidationError {
   readonly type: ValidationErrorType
   readonly message: string
   readonly partName?: string
   readonly dependencyName?: string
}

/**
 * Resolved dependency graph for a set of parts
 */
export interface DependencyGraph {
   /** All concrete parts in dependency order (dependencies before dependents) */
   readonly orderedParts: ContextPartConstructor[]
   /** Map from abstract contract name to concrete provider */
   readonly providerMap: Map<string, ContextPartConstructor>
   /** Map from part name to its resolved dependencies */
   readonly resolvedDependencies: Map<string, ContextPartConstructor[]>
}

// ============================================================================
// Registry Class
// ============================================================================

/**
 * Central registry for all @ContextPart-decorated classes.
 *
 * Provides:
 * - Registration of context parts
 * - Validation of abstract/concrete relationships
 * - Dependency resolution
 * - Assembly validation
 */
export class ContextPartRegistry {
   private readonly parts = new Map<string, ContextPartConstructor>()
   private readonly abstractParts = new Set<string>()
   private readonly providers = new Map<string, Set<string>>() // abstract -> concrete names

   /**
    * Register a context part with the registry.
    * Called automatically by the @ContextPart decorator.
    */
   register(target: ContextPartConstructor): void {
      const metadata = getContextPartMetadata(target)
      if (metadata == null) {
         throw new Error(
            `Cannot register ${target.name}: missing @ContextPart decorator`,
         )
      }

      const name = metadata.name

      // Check for duplicate registration
      if (this.parts.has(name)) {
         throw new Error(
            `Duplicate context part registration: "${name}" is already registered`,
         )
      }

      this.parts.set(name, target)

      if (metadata.isAbstract) {
         this.abstractParts.add(name)
      }

      // Track what abstract contracts this part provides
      for (const provided of metadata.provides) {
         const abstractName = provided.name
         if (!this.providers.has(abstractName)) {
            this.providers.set(abstractName, new Set())
         }
         this.providers.get(abstractName)!.add(name)
      }
   }

   /**
    * Get all registered parts
    */
   getAllParts(): ContextPartConstructor[] {
      return Array.from(this.parts.values())
   }

   /**
    * Get all abstract parts
    */
   getAbstractParts(): ContextPartConstructor[] {
      return Array.from(this.abstractParts).map(
         (name) => this.parts.get(name)!,
      )
   }

   /**
    * Get all concrete parts (non-abstract)
    */
   getConcreteParts(): ContextPartConstructor[] {
      return Array.from(this.parts.entries())
         .filter(([name]) => !this.abstractParts.has(name))
         .map(([, part]) => part)
   }

   /**
    * Get providers for an abstract contract
    */
   getProvidersFor(abstractPart: ContextPartConstructor): ContextPartConstructor[] {
      const metadata = getContextPartMetadata(abstractPart)
      if (metadata == null) return []

      const providerNames = this.providers.get(metadata.name) ?? new Set()
      return Array.from(providerNames).map((name) => this.parts.get(name)!)
   }

   /**
    * Get a part by name
    */
   getPartByName(name: string): ContextPartConstructor | undefined {
      return this.parts.get(name)
   }

   /**
    * Validate a set of parts for assembly.
    *
    * This checks:
    * 1. Every abstract dependency has exactly one concrete provider
    * 2. No circular dependencies exist
    * 3. All referenced dependencies exist
    * 4. No abstract parts are directly in the assembly list
    */
   validateForAssembly(
      parts: ContextPartConstructor[],
   ): AssemblyValidationResult {
      const errors: AssemblyValidationError[] = []
      const partNames = new Set(
         parts.map((p) => getContextPartMetadata(p)?.name ?? p.name),
      )

      // Collect all abstract contracts needed
      const abstractNeeded = new Map<string, string[]>() // abstract -> dependents

      for (const part of parts) {
         const metadata = getContextPartMetadata(part)
         if (metadata == null) continue

         // Check: abstract parts cannot be directly assembled
         if (metadata.isAbstract) {
            errors.push({
               type: ValidationErrorType.ABSTRACT_IN_ASSEMBLY,
               message: `Abstract part "${metadata.name}" cannot be directly assembled`,
               partName: metadata.name,
            })
            continue
         }

         // Collect dependencies
         for (const dep of metadata.dependsOn) {
            const depMeta = getContextPartMetadata(dep.partClass)
            if (depMeta?.isAbstract === true) {
               if (!abstractNeeded.has(dep.name)) {
                  abstractNeeded.set(dep.name, [])
               }
               abstractNeeded.get(dep.name)!.push(metadata.name)
            }
         }
      }

      // Collect all abstract contracts provided
      const abstractProvided = new Map<string, string[]>() // abstract -> providers

      for (const part of parts) {
         const metadata = getContextPartMetadata(part)
         if (metadata == null) continue

         for (const provided of metadata.provides) {
            if (!abstractProvided.has(provided.name)) {
               abstractProvided.set(provided.name, [])
            }
            abstractProvided.get(provided.name)!.push(metadata.name)
         }
      }

      // Validate: each needed abstract has exactly one provider
      for (const [abstractName, dependents] of Array.from(abstractNeeded)) {
         const providers = abstractProvided.get(abstractName) ?? []

         if (providers.length === 0) {
            errors.push({
               type: ValidationErrorType.MISSING_PROVIDER,
               message: `Abstract contract "${abstractName}" is required by [${dependents.join(", ")}] but has no provider`,
               dependencyName: abstractName,
            })
         } else if (providers.length > 1) {
            errors.push({
               type: ValidationErrorType.DUPLICATE_PROVIDER,
               message: `Abstract contract "${abstractName}" has multiple providers: [${providers.join(", ")}]`,
               dependencyName: abstractName,
            })
         }
      }

      // Check for unknown dependencies
      for (const part of parts) {
         const metadata = getContextPartMetadata(part)
         if (metadata == null) continue

         for (const dep of metadata.dependsOn) {
            const depMeta = getContextPartMetadata(dep.partClass)
            const depName = depMeta?.name ?? dep.name

            // If dependency is not abstract, it must be in the assembly
            if (depMeta?.isAbstract !== true && !partNames.has(depName)) {
               errors.push({
                  type: ValidationErrorType.UNKNOWN_DEPENDENCY,
                  message: `Part "${metadata.name}" depends on "${depName}" which is not in the assembly`,
                  partName: metadata.name,
                  dependencyName: depName,
               })
            }
         }
      }

      // Build dependency graph if no errors so far
      let dependencyGraph: DependencyGraph
      if (errors.length === 0) {
         const graphResult = this.buildDependencyGraph(parts, abstractProvided)
         if (graphResult.error != null) {
            errors.push(graphResult.error)
            dependencyGraph = {
               orderedParts: [],
               providerMap: new Map(),
               resolvedDependencies: new Map(),
            }
         } else {
            dependencyGraph = graphResult.graph!
         }
      } else {
         dependencyGraph = {
            orderedParts: [],
            providerMap: new Map(),
            resolvedDependencies: new Map(),
         }
      }

      return {
         isValid: errors.length === 0,
         errors,
         dependencyGraph,
      }
   }

   /**
    * Build a dependency graph for the given parts.
    * Returns parts in topological order (dependencies before dependents).
    */
   private buildDependencyGraph(
      parts: ContextPartConstructor[],
      abstractProvided: Map<string, string[]>,
   ): {
      graph?: DependencyGraph
      error?: AssemblyValidationError
   } {
      const partsByName = new Map<string, ContextPartConstructor>()
      const providerMap = new Map<string, ContextPartConstructor>()
      const resolvedDependencies = new Map<string, ContextPartConstructor[]>()

      // Build name -> part map and provider map
      for (const part of parts) {
         const metadata = getContextPartMetadata(part)
         if (metadata == null) continue
         partsByName.set(metadata.name, part)

         for (const provided of metadata.provides) {
            providerMap.set(provided.name, part)
         }
      }

      // Resolve dependencies for each part
      for (const part of parts) {
         const metadata = getContextPartMetadata(part)
         if (metadata == null) continue

         const resolved: ContextPartConstructor[] = []
         for (const dep of metadata.dependsOn) {
            const depMeta = getContextPartMetadata(dep.partClass)
            const depName = depMeta?.name ?? dep.name

            if (depMeta?.isAbstract === true) {
               // Resolve abstract to concrete provider
               const providers = abstractProvided.get(depName) ?? []
               if (providers.length === 1) {
                  resolved.push(partsByName.get(providers[0])!)
               }
            } else {
               // Direct dependency
               const depPart = partsByName.get(depName)
               if (depPart != null) {
                  resolved.push(depPart)
               }
            }
         }
         resolvedDependencies.set(metadata.name, resolved)
      }

      // Topological sort
      const visited = new Set<string>()
      const visiting = new Set<string>()
      const ordered: ContextPartConstructor[] = []

      const visit = (
         partName: string,
      ): AssemblyValidationError | undefined => {
         if (visited.has(partName)) return undefined
         if (visiting.has(partName)) {
            return {
               type: ValidationErrorType.CIRCULAR_DEPENDENCY,
               message: `Circular dependency detected involving "${partName}"`,
               partName,
            }
         }

         visiting.add(partName)

         const deps = resolvedDependencies.get(partName) ?? []
         for (const dep of deps) {
            const depMeta = getContextPartMetadata(dep)
            const depName = depMeta?.name ?? dep.name
            const error = visit(depName)
            if (error != null) return error
         }

         visiting.delete(partName)
         visited.add(partName)
         ordered.push(partsByName.get(partName)!)

         return undefined
      }

      for (const part of parts) {
         const metadata = getContextPartMetadata(part)
         if (metadata == null) continue
         const error = visit(metadata.name)
         if (error != null) {
            return { error }
         }
      }

      return {
         graph: {
            orderedParts: ordered,
            providerMap,
            resolvedDependencies,
         },
      }
   }

   /**
    * Clear the registry (mainly for testing)
    */
   clear(): void {
      this.parts.clear()
      this.abstractParts.clear()
      this.providers.clear()
   }
}

// ============================================================================
// Global Registry Instance
// ============================================================================

/**
 * The global context part registry.
 * Parts are automatically registered here by the @ContextPart decorator.
 */
export const globalContextPartRegistry = new ContextPartRegistry()

/**
 * Register a part with the global registry.
 * This is called automatically by @ContextPart but can also be called manually.
 */
export function registerContextPart(target: ContextPartConstructor): void {
   globalContextPartRegistry.register(target)
}
