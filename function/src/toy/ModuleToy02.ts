import { ConfigurableModuleBuilder, DynamicModule, Inject, Injectable, Module } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { BaseBlockstore } from "blockstore-core"

import { buildLruCache, FsBlockstore } from "../ipfs/components/FsBlockstore.js"
import { FsBlockstoreConfiguration } from "../ipfs/components/FsBlockstoreConfiguration.js"
import { IpfsModuleTypes } from "../ipfs/di/typez.js"
import { IpldRegionMapRepository } from "../plotting/components/IpldRegionMapRepository.js"
import { IpldRegionMapSchemaDsl } from "../plotting/components/IpldRegionMapSchemaDsl.js"
import { PlottingModuleTypes } from "../plotting/di/typez.js"
import { IRegionMapRepository } from "../plotting/interface/IRegionMapRepository.js"
import { PBufRegionMapDecoder } from "../plotting/protobuf/PBufRegionMapDecoder.js"
import { ProtobufAdapter } from "../plotting/protobuf/ProtobufAdapter.js"

export class ModuleInstanceConfiguration {
  constructor (
    public readonly injectToken: symbol | string
  ) {}
}

export const InjectedBlockstore: unique symbol = Symbol("InjectedBlockstore")
export const InjectedAltRepo: unique symbol = Symbol("InjectedAltRepository")

function applyExtras (module: DynamicModule, extras: ModuleInstanceConfiguration): DynamicModule {
  if (extras.injectToken !== IpfsModuleTypes.AbstractBlockstore) {
    if (module.providers === undefined) {
      module.providers = [{ provide: extras.injectToken, useExisting: IpfsModuleTypes.AbstractBlockstore }]
    } else {
      module.providers.push({ provide: extras.injectToken, useExisting: IpfsModuleTypes.AbstractBlockstore })
    }
    if (module.exports === undefined) {
      module.exports = [extras.injectToken]
    } else {
      module.exports.push(extras.injectToken)
    }
  }
  console.log(module.module)
  return module
  /*
  return {
    ...module,
    providers: [
      ...(module.providers ?? []),
      {
        provide: extras.injectToken,
        useExisting: BaseBlockstore
      }
    ],
    exports: [
      ...(module.exports ?? []), extras.injectToken
    ]
  }
  */
}

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } =
  new ConfigurableModuleBuilder<FsBlockstoreConfiguration, "register", "create">({
    optionsInjectionToken: IpfsModuleTypes.FsBlockstoreConfig,
    alwaysTransient: true
  })
    .setClassMethodName("register")
    .setFactoryMethodName("create")
    .setExtras(new ModuleInstanceConfiguration("Inject"), applyExtras)
    .build()

console.log("AA")
console.log(ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE)
console.log("BB")

export class DynamicImportConfig {
  // constructor (public readonly sourceModule: any, public readonly blockstoreProvider: string | symbol) {}
  constructor (public readonly ipfsModule?: DynamicModule, bsToken: string | symbol) { }
}

const { ConfigurableModuleClass: DynamicRepoBaseModule, MODULE_OPTIONS_TOKEN: MOD_OPT_TOKEN, OPTIONS_TYPE: OPTIONS_TYPE_2, ASYNC_OPTIONS_TYPE: ASYNC_OPTIONS_TYPE_2 } =
  new ConfigurableModuleBuilder<{}, "register", "provideBlockstore", DynamicImportConfig>({
    optionsInjectionToken: InjectedBlockstore,
    alwaysTransient: true
  })
    .setClassMethodName("register")
    .setFactoryMethodName("provideBlockstore")
    .setExtras(new DynamicImportConfig(undefined), (module: DynamicModule, extra: DynamicImportConfig) => {
      if (extra.ipfsModule !== undefined) {
        if (module.imports === undefined) {
          module.imports = [extra.ipfsModule]
        } else {
          module.imports.push(extra.ipfsModule)
        }
      }
      if (extra.bsToken !== undefined) {
        if (module.providers === undefined) {
          module.providers = [{ provide: InjectedBlockstore, useExisting: extra.bsTokenp }]
        } else {
          module.providers.push({ provide: InjectedBlockstore, useExisting: extra.bsTokenp })
        }
      }

      console.dir(module, { depth: Infinity })
      return module
    }).build()

console.log("CC")
console.log(DynamicRepoBaseModule, MOD_OPT_TOKEN, OPTIONS_TYPE_2, ASYNC_OPTIONS_TYPE_2)
console.log("DD")

@Module({
  providers: [
  {
  provide: IpfsModuleTypes.LruCache,
  useFactory: buildLruCache,
  inject: [IpfsModuleTypes.FsBlockstoreConfig]
  },
  { provide: IpfsModuleTypes.AbstractBlockstore, useClass: FsBlockstore }
  ],
  exports: [IpfsModuleTypes.AbstractBlockstore]
  })
export class IpfsModule extends ConfigurableModuleClass {
  // static module = initializer(IpfsModule)

  static register (config: typeof OPTIONS_TYPE): DynamicModule {
    return super.register(config)
  }

  static registerAsync (options: typeof ASYNC_OPTIONS_TYPE): DynamicModule {
    return super.registerAsync(options)
  }
}

const SharedArtBlockStore: unique symbol = Symbol("SharedArtworkBlockstore")
// const SharedArtBlockStoreDynamicImport: unique symbol = Symbol("DynamicImport<SharedArtworkBlockstore>")
const SharedArtBlockStoreHolder: unique symbol = Symbol("SharedArtworkBlockstoreHolder")

const dynamicIpfs = IpfsModule.register({ rootPath: "/home/ionadmin/Documents/raBlocks", cacheSize: 500, injectToken: SharedArtBlockStore })

const AltRepository: unique symbol = Symbol("AltRepository")

@Injectable()
export class InjectedAltRepository {
  constructor (
    @Inject(InjectedBlockstore) private readonly sharedBlockstore: BaseBlockstore
  ) {
    console.log(`Injected repository has ${sharedBlockstore.constructor.name} on construction`)
  }
}

@Module({
  imports: [],
  providers: [
  {
  provide: InjectedAltRepo,
  useClass: InjectedAltRepository
  }
  ],
  exports: [InjectedAltRepo]
  })
export class AltDynamicDependencyModule extends DynamicRepoBaseModule {
  public static registerAsync (options: typeof ASYNC_OPTIONS_TYPE_2): DynamicModule {
    return super.registerAsync(options)
  }
}

@Injectable()
export class AppService {
  constructor (
    @Inject(InjectedAltRepo)
    private readonly altDynamicRepo: InjectedAltRepository,
    @Inject(SharedArtBlockStore)
    private readonly sabs: BaseBlockstore
  ) { }

  public doWork (): void {
    console.log(`Got <${this.altDynamicRepo.constructor.name}`)
    if (this.sabs !== undefined) {
      console.log("Got sabs")
    }
  }
}

@Module({
  imports: [
  dynamicIpfs,
  AltDynamicDependencyModule.registerAsync({
    ipfsModule: dynamicIpfs, bsToken: SharedArtBlockStore
    })
  ],
  providers: [AppService],
  exports: [dynamicIpfs, AppService ]
  })
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AppModule {}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function bootstrap () {
  const app = await NestFactory.createApplicationContext(AppModule)
  const appSvc = app.get(AppService)
  await appSvc.doWork()
}

bootstrap().catch((err) => console.log(err))
