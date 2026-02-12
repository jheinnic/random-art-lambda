import { Type } from "@nestjs/common"

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
 * Transform instance methods to static methods with explicit `this` parameter
 */
export type StaticExtensionOf<T, TDelegate> = {
   [K in keyof MethodsOf<T>]: T[K] extends (
      this: any,
      ...args: infer P
   ) => infer R
      ? (this: TDelegate, ...args: P) => R
      : never
}

/**
 * The unified delegate type - combines Base + DTO + Methods (without `this`)
 */
export type DelegateOf<TBase, TBlueprint> = TBase &
   DataPropertiesOf<TBlueprint> & {
      [K in keyof MethodsOf<TBlueprint>]: TBlueprint[K] extends (
         ...args: infer P
      ) => infer R
         ? (...args: P) => R // Strip `this` parameter for delegate
         : never
   }

/**
 * Result from defineExtension factory
 */
export interface ExtensionDefinition<TBase, TBlueprint, TDelegate> {
   /**
    * DTO class - contains only data properties
    * Use this for serialization/deserialization
    */
   DTO: Type<DataPropertiesOf<TBlueprint>>

   /**
    * Static Extension class - contains methods as static members
    * Each static method expects `this` to be the Delegate type
    */
   Extension: StaticExtensionOf<TBlueprint, TDelegate>

   /**
    * Delegate type - the unified context type
    * This is what middleware receives (Base + DTO + Extension methods)
    */
   Delegate: Type<TDelegate>
}

/**
 * Define an extension by decomposing a blueprint class into DTO + Extension + Delegate.
 *
 * ## Usage
 *
 * ```typescript
 * // 1. Define your blueprint class naturally
 * class MyCampaignExtension extends BaseModel {
 *    // Data properties
 *    campaignName: string = ''
 *    seedValue: number = 0
 *
 *    // Methods can call each other via `this`
 *    getCampaignHash(): string {
 *       return hash(this.campaignName + this.seedValue.toString())
 *    }
 *
 *    getFilename(): string {
 *       return `${this.getCampaignHash()}.png`
 *    }
 * }
 *
 * // 2. Decompose it
 * const MyCampaign = defineExtension(BaseModel, MyCampaignExtension)
 *
 * // 3. Use the parts:
 * // MyCampaign.DTO - for serialization
 * // MyCampaign.Extension - static methods with proper `this` binding
 * // MyCampaign.Delegate - type for unified context proxy
 * ```
 *
 * @template TBase - The base model type (framework-provided)
 * @template TBlueprint - The blueprint class that extends TBase
 * @param Base - Base model constructor
 * @param Blueprint - Blueprint class constructor
 * @returns ExtensionDefinition with DTO, Extension, and Delegate
 */
export function defineExtension<
   TBase extends object,
   TBlueprint extends TBase,
>(
   Base: Type<TBase>,
   Blueprint: Type<TBlueprint>,
): ExtensionDefinition<TBase, TBlueprint, DelegateOf<TBase, TBlueprint>> {
   // Runtime: Extract property descriptors from entire prototype chain
   // Walk from Blueprint up to (but not including) Base
   const baseProto = Base.prototype
   const seen = new Set<string>()

   const dataKeys: string[] = []
   const methodKeys: string[] = []
   const methods = new Map<string, Function>() // Store actual method references

   // Step 1: Extract instance fields by creating a temporary instance
   // This captures TypeScript class fields (dataField = "value")
   try {
      const tempInstance = new Blueprint()
      const baseInstance = new Base()

      // Get instance properties (class fields)
      for (const key of Object.keys(tempInstance)) {
         if (!seen.has(key) && !(key in baseInstance)) {
            seen.add(key)
            const value = (tempInstance as any)[key]
            if (typeof value !== "function") {
               dataKeys.push(key)
            }
         }
      }
   } catch (e) {
      // If constructor fails, we'll just rely on prototype scanning
   }

   // Step 2: Walk prototype chain for methods and prototype properties
   let proto = Blueprint.prototype

   // Walk prototype chain until we reach Base or Object
   while (proto && proto !== baseProto && proto !== Object.prototype) {
      const allKeys = Object.getOwnPropertyNames(proto).filter(
         (k) => k !== "constructor" && !seen.has(k),
      )

      // Classify keys as data or methods
      for (const key of allKeys) {
         seen.add(key) // Mark as seen to avoid duplicates

         const descriptor = Object.getOwnPropertyDescriptor(proto, key)
         if (descriptor && typeof descriptor.value === "function") {
            methodKeys.push(key)
            methods.set(key, descriptor.value) // Store the actual method
         } else {
            dataKeys.push(key)
         }
      }

      // Move up the prototype chain
      proto = Object.getPrototypeOf(proto)
   }

   // 1. Create DTO class (data properties only)
   class DTO {
      constructor() {
         // Initialize data properties with undefined
         // In practice, these would be set from incoming data
         for (const key of dataKeys) {
            ;(this as any)[key] = undefined
         }
      }
   }

   // Preserve the name for debugging
   Object.defineProperty(DTO, "name", {
      value: `${Blueprint.name}_DTO`,
   })

   // 2. Create Static Extension class
   class Extension {
      private constructor() {
         // Non-instantiable - this class only has static methods
      }
   }

   // Preserve the name for debugging
   Object.defineProperty(Extension, "name", {
      value: `${Blueprint.name}_Extension`,
   })

   // Runtime surgery: Copy methods from prototype chain to Extension as static
   for (const methodName of methodKeys) {
      const originalMethod = methods.get(methodName)

      if (!originalMethod) {
         continue // Should never happen, but be safe
      }

      // Create static method that expects `this` to be the delegate
      ;(Extension as any)[methodName] = function (
         this: DelegateOf<TBase, TBlueprint>,
         ...args: any[]
      ) {
         // Call original method with delegate as `this`
         // This allows methods to call each other via `this.otherMethod()`
         return originalMethod.call(this, ...args)
      }
   }

   // 3. Delegate is conceptual (will be created by proxy at runtime)
   // For typing purposes, we create a dummy class
   class Delegate {}
   Object.defineProperty(Delegate, "name", {
      value: `${Blueprint.name}_Delegate`,
   })

   return {
      DTO: DTO as any,
      Extension: Extension as any,
      Delegate: Delegate as any as Type<DelegateOf<TBase, TBlueprint>>,
   }
}

/**
 * Create a unified delegate instance from separate parts.
 *
 * This creates a Proxy that:
 * - Provides access to Base model properties
 * - Provides access to DTO data properties
 * - Provides access to Extension methods (bound to the proxy as `this`)
 *
 * @template TBase - Base model type
 * @template TBlueprint - Blueprint type
 * @param baseModel - Base model instance
 * @param dto - DTO instance with data properties
 * @param Extension - Static extension class
 * @returns Unified delegate proxy
 */
export function createDelegate<TBase extends object, TBlueprint extends TBase>(
   baseModel: TBase,
   dto: DataPropertiesOf<TBlueprint>,
   Extension: StaticExtensionOf<TBlueprint, DelegateOf<TBase, TBlueprint>>,
): DelegateOf<TBase, TBlueprint> {
   // Create a proxy that unifies all three sources
   const delegate = new Proxy(dto, {
      get(target, prop, receiver) {
         // 1. Check DTO data properties first
         if (prop in target) {
            return Reflect.get(target, prop, receiver)
         }

         // 2. Check Base model
         if (prop in baseModel) {
            return (baseModel as any)[prop]
         }

         // 3. Check Extension static methods
         if (prop in Extension) {
            const method = (Extension as any)[prop]
            // Bind the static method to the proxy itself as `this`
            // This enables methods to call each other via `this.otherMethod()`
            return method.bind(receiver)
         }

         return undefined
      },

      has(target, prop) {
         return prop in target || prop in baseModel || prop in Extension
      },

      ownKeys(target) {
         const dtoKeys = Reflect.ownKeys(target)
         const baseKeys = Reflect.ownKeys(baseModel)
         const extKeys = Reflect.ownKeys(Extension)
         return [...new Set([...dtoKeys, ...baseKeys, ...extKeys])]
      },
   }) as DelegateOf<TBase, TBlueprint>

   return delegate
}
