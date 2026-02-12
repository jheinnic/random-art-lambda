import {
   DynamicModule,
   Provider,
   InjectionToken,
   Type,
   Module,
} from "@nestjs/common"

// Part 1: Get the number of keys in an object type T
// Part 1: Get the number of keys in an object type T
type LengthOfKeys<T> = [keyof T] extends [infer K] ? K[]["length"] : never
// type LengthOfKeys2<T extends {}> = keyof T extends infer K
//    ? K extends K
//       ? K[]["length"]
//       : never
//    : never

// Part 2: Check if a tuple K has all the keys from object T
type HasAllKeys<T, K extends Array<keyof T>> = {
   [P in keyof T]: P extends K[number] ? true : false
}[keyof T] extends true
   ? true
   : false

// Part 3: Combine checks into the final validation type
type IsValidKeyTuple<T, K extends Array<keyof T>> =
   K["length"] extends LengthOfKeys<T>
      ? HasAllKeys<T, K> extends true
         ? true
         : false
      : false

type ValidKeyTuple<T, K extends Array<keyof T>> =
   IsValidKeyTuple<T, K> extends true ? K : never

type KeyTupleTypes<T, K extends Array<keyof T>> = {
   [P in keyof K]: T[K[P]] extends infer R ? R : never
} & any[]

type ProviderState<T> = {
   [K in Exclude<keyof T, number>]: {
      consumingProvider: {
         provide: K
         useFactory: () => Promise<T[K]>
      }
      providingResolver: (value: T[K]) => void
   }
}

type DependentProviders<T> = {
   [K in Exclude<keyof T, number>]: Provider<T[K]>
}

interface SolutionElement {
   module: Type<any> | DynamicModule
   export: Type<any> | InjectionToken
}
export type DependencySolution<T> = {
   [K in keyof T]: SolutionElement
}

type DependentModuleSubclass<T> = (new () => any) &
   Record<"forRoot", (solution: DependencySolution<T>) => DynamicModule>

export interface DependentModuleHost<T> {
   moduleClass: DependentModuleSubclass<T>
   dependentProviders: DependentProviders<T>
}

export class DependentModuleFactory<T> {
   private readonly providers: ProviderState<T>

   constructor(
      private readonly tokens: ValidKeyTuple<
         T,
         Array<Exclude<keyof T, number>>
      >,
   ) {
      const initial = {} as unknown as ProviderState<T>
      this.providers = this.tokens.reduce<ProviderState<T>>(
         (
            acc: ProviderState<T>,
            key: Exclude<keyof T, number>,
         ): ProviderState<T> => {
            let resolver
            const p = new Promise<T[typeof key]>((resolve, _reject) => {
               resolver = resolve
            })
            if (resolver === undefined) {
               throw new Error("never")
            }
            acc[key] = {
               consumingProvider: {
                  provide: key,
                  useFactory: async (): Promise<T[typeof key]> => {
                     return await p
                  },
               },
               providingResolver: resolver,
            }
            return acc
         },
         initial,
      )
   }

   build(): DependentModuleHost<T> {
      // Custom implementation for `registerAsync` that handles provider injection
      const resolvers = this.providers
      const tokens = this.tokens

      // eslint-disable-next-line @typescript-eslint/no-extraneous-class
      const DependentModuleSubclass: DependentModuleSubclass<T> = class DependentModuleSubclass {
         public static forRoot(solution: DependencySolution<T>): DynamicModule {
            const importSet = new Set(tokens.map((x) => solution[x].module))
            return {
               module: this,
               imports: [...importSet],
               providers: [
                  {
                     provide: "Solution",
                     useFactory: (
                        ...args: KeyTupleTypes<T, typeof tokens>
                     ): any => {
                        tokens.forEach(
                           (x: Exclude<keyof T, number>, idx: number) => {
                              resolvers[x].providingResolver(args[idx])
                           },
                        )
                     },
                     inject: tokens.map((x: keyof T) => solution[x].export),
                  },
               ],
               exports: ["Solution"],
            }
         }
      }

      const initial = {} as unknown as DependentProviders<T>
      return {
         moduleClass: DependentModuleSubclass,
         dependentProviders: tokens.reduce(
            (
               acc: DependentProviders<T>,
               key: Exclude<keyof T, number>,
            ): DependentProviders<T> => {
               acc[key] = resolvers[key].consumingProvider
               return acc
            },
            initial,
         ),
      }
   }
}

interface Stuff {
   x: string
}
const foo = new DependentModuleFactory<Stuff>(["x"]).build()
@Module({})
class StuffModule extends foo.moduleClass {}
