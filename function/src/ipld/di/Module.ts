import { DynamicModule, InjectionToken, Module, Type } from "@nestjs/common"
import type { BlockCodec, MultihashHasher } from "multiformats"
import { sha256 as hasher } from "multiformats/hashes/sha2"
import * as codec from "@ipld/dag-cbor"
import { objectKeys } from "simplytyped"

import { ISerdesModuleBuilder } from "./Extra.js"
import { IpldModuleTypes } from "./Types.js"
import { IpldSerdesFactory } from "../components/IpldSerdesFactory.js"
import {
   SimpleDynamicModule,
   IDynamicModuleBuilder,
} from "../../modules/index.js"
import {
   ISerdes,
   RepresentationOf,
   RepresentDomainTuple,
   RepresentDomainTupleByName,
   SchemaNameOf,
} from "../interface/index.js"

@Module({})
export class IpldModule {
   static registerModule<
      T extends RepresentDomainTuple<string, unknown, unknown>,
   >(
      schemaDsl: string,
      director: (builder: ISerdesModuleBuilder<T>) => void,
   ): DynamicModule {
      const builder = new IpldSerdesModuleBuilder<T>(
         this,
         schemaDsl,
         codec,
         hasher,
      )
      director(builder)

      return SimpleDynamicModule.registerModule(builder.build())
   }
}

class IpldSerdesModuleBuilder<
   T extends RepresentDomainTuple<string, unknown, unknown> = any,
   Code extends number = 113,
   Hash extends number = 18,
> implements ISerdesModuleBuilder<T, Code, Hash>
{
   private readonly productions: Partial<
      Record<SchemaNameOf<T>, InjectionToken>
   > = {}

   constructor(
      private readonly module: Type<any>,
      private readonly schemaDsl: string,
      private codec: BlockCodec<Code, RepresentationOf<T>>,
      private hasher: MultihashHasher<Hash>,
   ) {}

   exportProduction(
      typeName: SchemaNameOf<T>,
      token: InjectionToken,
   ): ISerdesModuleBuilder<T, Code, Hash> {
      this.productions[typeName] = token
      return this
   }

   changeCodec<Code2 extends number = Code>(
      codec: BlockCodec<Code2, RepresentationOf<T>>,
   ): ISerdesModuleBuilder<T, Code2, Hash> {
      const newThis: IpldSerdesModuleBuilder<T, Code2, Hash> =
         this as unknown as IpldSerdesModuleBuilder<T, Code2, Hash>
      newThis.codec = codec
      return newThis
   }

   changeMultihash<Hash2 extends number = Hash>(
      hasher: MultihashHasher<Hash2>,
   ): ISerdesModuleBuilder<T, Code, Hash> {
      const newThis: IpldSerdesModuleBuilder<T, Code, Hash2> =
         this as unknown as IpldSerdesModuleBuilder<T, Code, Hash2>
      newThis.hasher = hasher
      return newThis
   }

   build(): (builder: IDynamicModuleBuilder) => void {
      const productions: Record<SchemaNameOf<T>, InjectionToken> = this
         .productions as Record<SchemaNameOf<T>, InjectionToken>
      const schemaNames: Array<SchemaNameOf<T>> = objectKeys(productions)
      const codec: BlockCodec<Code, RepresentationOf<T>> = this.codec
      const hasher: MultihashHasher<Hash> = this.hasher
      const schemaDsl = this.schemaDsl

      return (builder: IDynamicModuleBuilder): void => {
         builder
            .identifyAs(this.module)
            .defineProviders({
               provide: IpldModuleTypes.SchemaFactory,
               useFactory: () => {
                  return new IpldSerdesFactory<T, Code, Hash>(
                     schemaDsl,
                     codec,
                     hasher,
                  )
               },
            })
            .exportProviders(
               ...schemaNames.map((entry: SchemaNameOf<T>) => {
                  return {
                     provide: productions[entry],
                     useFactory: (
                        factory: IpldSerdesFactory<T, Code, Hash>,
                     ): ISerdes<
                        RepresentDomainTupleByName<typeof entry, T>
                     > => {
                        return factory.getProduction(entry)
                     },
                     inject: [IpldModuleTypes.SchemaFactory],
                  }
               }),
            )
      }
   }
}

// const dynamicHost = new ConfigurableModuleBuilder<
//    IpldModuleConfiguration,
//    typeof REGISTER_METHOD_KEY,
//    typeof FACTORY_METHOD_KEY,
//    IpldModuleExtras
// >({
//    moduleName: "Ipld",
//    optionsInjectionToken: IpldModuleTypes.ModuleConfiguration,
//    alwaysTransient: true,
// })
//    .setClassMethodName(REGISTER_METHOD_KEY)
//    .setFactoryMethodName(FACTORY_METHOD_KEY)
//    .setExtras(
//       { serdes: new SerdesConfiguration("", {}, codec, hasher) },
//       (
//          module: DynamicModule,
//          extraWrapper: IpldModuleExtras,
//       ): DynamicModule => {
//          const extras = extraWrapper.serdes
//          if (extras.schemaDsl === "") {
//             return module
//          }

//          if (module.providers === undefined) {
//             module.providers = []
//          }
//          let rootProduction: string
//          // console.log(extras.rootProductionTokens)
//          const serdesFactory = new IpldSerdesFactory(
//             extras.schemaDsl,
//             extras.codec,
//             extras.hasher,
//          )
//          for (rootProduction of Object.keys(extras.rootProductionTokens)) {
//             // console.log(rootProduction)
//             // console.log(extras.rootProductionTokens[rootProduction])
//             module.providers.push({
//                provide: extras.rootProductionTokens[rootProduction],
//                useValue: serdesFactory.getProduction(rootProduction),
//             })
//          }
//          if (module.exports === undefined) {
//             module.exports = Object.values(extras.rootProductionTokens)
//          } else {
//             module.exports.concat(Object.values(extras.rootProductionTokens))
//          }

//          console.log(module)
//          return module
//       },
//    )
//    .build()

// export type IpldModuleOptions = typeof dynamicHost.OPTIONS_TYPE
// export type IpldModuleAsyncOptions = typeof dynamicHost.ASYNC_OPTIONS_TYPE

// @Module({
//    providers: [],
//    exports: [],
// })
// export class IpldModule extends dynamicHost.ConfigurableModuleClass {
//    static register(config: IpldModuleOptions): DynamicModule {
//       return super.register(config)
//    }

//    static registerAsync(options: IpldModuleAsyncOptions): DynamicModule {
//       return super.registerAsync(options)
//    }
// }
