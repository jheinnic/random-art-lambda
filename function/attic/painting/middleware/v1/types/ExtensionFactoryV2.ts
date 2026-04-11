import { Type } from "@nestjs/common"

/**
 * ExtensionFactory V2 - Dependency Injection Pattern
 *
 * This version supports explicit dependency injection for handling
 * multiple inheritance (diamond pattern) scenarios.
 *
 * Key concepts:
 * - Interface inheritance for logical structure (IExtOne extends IBase)
 * - Implementation classes use dependency injection (_ExtOne(base: IBase))
 * - Concrete classes wire up all dependencies (ExtOne extends _ExtOne)
 * - Idempotent sharing of common base across branches
 */

/**
 * Extract only data properties (non-functions) from a type
 */
export type DataPropertiesOf<T> = {
   [K in keyof T as T[K] extends Function ? never : K]: T[K]
}

/**
 * Extract only methods from a type
 */
export type MethodsOf<T> = {
   [K in keyof T as T[K] extends Function ? K : never]: T[K]
}

/**
 * Dependency metadata extracted from constructor parameters
 */
export interface DependencyMetadata {
   /**
    * Parameter names extracted from constructor signature
    */
   paramNames: string[]

   /**
    * Types of dependencies (if available via reflection)
    */
   paramTypes?: Array<Type<any>>

   /**
    * Map of parameter names to their types (for dependency resolution)
    */
   paramTypeMap?: Map<string, Type<any>>
}

/**
 * Extension definition with dependency metadata
 */
export interface ExtensionDefinitionV2<
   TBase extends object,
   TBlueprint extends object,
   TInterface = TBlueprint,
> {
   /**
    * Interface type for this extension (logical inheritance)
    */
   Interface: Type<TInterface>

   /**
    * Implementation class that takes dependencies via constructor
    */
   Implementation: Type<TBlueprint>

   /**
    * DTO class - contains only data properties
    */
   DTO: Type<DataPropertiesOf<TBlueprint>>

   /**
    * Dependency metadata
    */
   dependencies: DependencyMetadata

   /**
    * Base type this extension builds upon
    */
   baseType: Type<TBase>
}

/**
 * Extract constructor parameter names from a class
 *
 * Uses regex to parse the constructor signature since TypeScript
 * doesn't preserve parameter names in compiled JavaScript without
 * explicit reflection metadata.
 */
function extractConstructorParams(ctor: Function): string[] {
   const ctorStr = ctor.toString()

   // Match constructor parameters
   const match = ctorStr.match(/constructor\s*\(([\s\S]*?)\)/)
   if (match == null) return []

   const paramsStr = match[1]
   if (!paramsStr.trim()) return []

   // Parse parameter names (handle TypeScript annotations)
   return paramsStr
      .split(",")
      .map((param) => {
         // Extract parameter name before type annotation
         const nameMatch = param.trim().match(/^(\w+)/)
         return nameMatch != null ? nameMatch[1] : ""
      })
      .filter((name) => name !== "")
}

/**
 * Define an extension with dependency injection support.
 *
 * Usage:
 * ```typescript
 * // Interface (logical inheritance)
 * interface IExtTwo extends IBase {
 *    bar(): number
 * }
 *
 * // Implementation (dependency injection)
 * class _ExtTwo implements IExtTwo {
 *    constructor(private readonly base: IBase) {}
 *
 *    field = ""  // Instance field
 *
 *    get name(): string { return this.base.name }
 *    bar(): number { return 3 }
 * }
 *
 * // Define extension (provide exemplar if class has instance fields)
 * const base = new BaseModel()
 * const exemplar = new _ExtTwo(base)
 *
 * const ExtTwoDef = defineExtensionV2(
 *    BaseModel,
 *    _ExtTwo,
 *    ['base'],      // Dependency names
 *    [BaseModel],   // Dependency types
 *    exemplar       // Exemplar for scanning instance fields
 * )
 * ```
 *
 * @template TBase - Base model type
 * @template TBlueprint - Implementation class type
 * @template TInterface - Interface type (defaults to TBlueprint)
 * @param Base - Base model constructor
 * @param Implementation - Implementation class constructor
 * @param dependencyNames - Optional explicit dependency names
 * @param dependencyTypes - Optional explicit dependency types
 * @param exemplar - Optional exemplar instance for scanning instance fields
 * @returns Extension definition with dependency metadata
 */
export function defineExtensionV2<
   TBase extends object,
   TBlueprint extends object,
   TInterface = TBlueprint,
>(
   Base: Type<TBase>,
   Implementation: Type<TBlueprint>,
   dependencyNames?: string[],
   dependencyTypes?: Array<Type<any>>,
   exemplar?: TBlueprint,
): ExtensionDefinitionV2<TBase, TBlueprint, TInterface> {
   // Extract constructor parameters
   const paramNames =
      dependencyNames ?? extractConstructorParams(Implementation)

   // Create parameter type map if types provided
   const paramTypeMap = new Map<string, Type<any>>()
   if (
      dependencyTypes != null &&
      dependencyTypes.length === paramNames.length
   ) {
      paramNames.forEach((name: string, index: number) => {
         paramTypeMap.set(name, dependencyTypes[index])
      })
   }

   // Extract data properties from exemplar instance
   // Data only exists on instances, not prototypes!
   // Prototypes only contain methods, getters, and setters.
   const dataKeys: string[] = []

   if (exemplar != null) {
      for (const key of Object.keys(exemplar)) {
         const value = (exemplar as any)[key]
         if (typeof value !== "function") {
            dataKeys.push(key)
         }
      }
   }

   // Create DTO class
   class DTO {
      constructor() {
         for (const key of dataKeys) {
            ;(this as any)[key] = undefined
         }
      }
   }

   Object.defineProperty(DTO, "name", {
      value: `${Implementation.name}_DTO`,
   })

   return {
      Interface: Implementation as any as Type<TInterface>,
      Implementation,
      DTO: DTO as any,
      dependencies: {
         paramNames,
         paramTypeMap,
      },
      baseType: Base,
   }
}

/**
 * Dependency resolution context for building extension instances
 */
export class DependencyResolver {
   private readonly instances = new Map<Type<any>, any>()
   private readonly building = new Set<Type<any>>()

   /**
    * Register a base instance
    */
   registerBase<T>(type: Type<T>, instance: T): void {
      this.instances.set(type, instance)
   }

   /**
    * Build an extension instance with dependency injection
    *
    * @param extensionDef Extension definition
    * @param data Data to populate the instance with
    * @returns Constructed extension instance
    */
   build<TBase extends object, TBlueprint extends object>(
      extensionDef: ExtensionDefinitionV2<TBase, TBlueprint>,
      data?: Partial<DataPropertiesOf<TBlueprint>>,
   ): TBlueprint {
      const { Implementation, dependencies, baseType } = extensionDef

      // Check for circular dependencies
      if (this.building.has(Implementation)) {
         throw new Error(`Circular dependency detected: ${Implementation.name}`)
      }

      // Check if already built
      if (this.instances.has(Implementation)) {
         return this.instances.get(Implementation)
      }

      this.building.add(Implementation)

      try {
         // Resolve dependencies
         const deps: any[] = []
         for (const paramName of dependencies.paramNames) {
            let dep: any

            // If we have a type map, use it to look up by specific type
            if (dependencies.paramTypeMap?.has(paramName)) {
               const paramType = dependencies.paramTypeMap.get(paramName)!
               dep = this.instances.get(paramType)
            }

            // Fallback to base type lookup
            if (!dep) {
               dep = this.instances.get(baseType)
            }

            if (!dep) {
               throw new Error(
                  `Dependency '${paramName}' not found for ${Implementation.name}`,
               )
            }
            deps.push(dep)
         }

         // Construct instance
         const instance = new Implementation(...deps)

         // Populate with data (only writable properties)
         if (data != null) {
            for (const [key, value] of Object.entries(data)) {
               const descriptor = Object.getOwnPropertyDescriptor(instance, key)
               // Only assign if property is writable or doesn't exist yet
               if (descriptor == null || descriptor.writable !== false) {
                  try {
                     ;(instance as any)[key] = value
                  } catch (e) {
                     // Skip read-only properties (getters without setters)
                  }
               }
            }
         }

         // Register instance
         this.instances.set(Implementation, instance)
         this.building.delete(Implementation)

         return instance
      } catch (error) {
         this.building.delete(Implementation)
         throw error
      }
   }

   /**
    * Get an already-built instance
    */
   get<T>(type: Type<T>): T | undefined {
      return this.instances.get(type)
   }

   /**
    * Check if an instance has been built
    */
   has(type: Type<any>): boolean {
      return this.instances.has(type)
   }
}
