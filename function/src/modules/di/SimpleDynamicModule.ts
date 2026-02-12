import { DynamicModule, Module } from "@nestjs/common"
import { DynamicModuleBlueprint } from "./DynamicModuleBlueprint.js"
import { IDynamicModuleBuilder } from "../interface/IDynamicModuleBuilder.js"

// export class SimpleDynamicModule {
//    private readonly __I_LIKE_TO_COMPILE: unknown

//    public static registerModule(
//       className: string,
//       director: (builder: IDynamicModuleBuilder) => void,
//    ): DynamicModule {
//       const aModuleClass: Function & {
//          registerModule: (
//             director: (builder: IDynamicModuleBuilder) => void,
//          ) => DynamicModule
//       } = class ModuleClass {
//          public readonly __I_LIKE_TO_COMPILE: unknown

//          static registerModule(
//             director: (builder: IDynamicModuleBuilder) => void,
//          ): DynamicModule {
//             const moduleFactoryBuilder = new DynamicModuleBlueprint(this)
//             director(moduleFactoryBuilder)
//             return moduleFactoryBuilder.build()
//          }
//       }

//       Object.defineProperty(aModuleClass, "name", {
//          value: className,
//          writable: false,
//          enumerable: false,
//          configurable: true,
//       })
//       Module({})(aModuleClass)

//       return aModuleClass.registerModule(director)
//    }
// }

export interface ISimpleDynamicModule {
   new (): any
   registerModule: (
      director: (builder: IDynamicModuleBuilder) => void,
   ) => DynamicModule
}

export function simpleDynamicModule(className: string): ISimpleDynamicModule {
   const aModuleClass: ISimpleDynamicModule = class ModuleClass {
      public readonly __I_LIKE_TO_COMPILE: unknown

      static registerModule(
         director: (builder: IDynamicModuleBuilder) => void,
      ): DynamicModule {
         const moduleFactoryBuilder = new DynamicModuleBlueprint(this)
         director(moduleFactoryBuilder)
         return moduleFactoryBuilder.build()
      }
   }

   Object.defineProperty(aModuleClass, "name", {
      value: className,
      writable: false,
      enumerable: false,
      configurable: true,
   })
   Module({})(aModuleClass)

   return aModuleClass
}
