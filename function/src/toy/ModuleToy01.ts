import { ConfigurableModuleBuilder, DynamicModule, Inject, Injectable, Module } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { BaseBlockstore } from "blockstore-core"

import { buildLruCache, FsBlockstore } from "../ipfs/components/FsBlockstore.js"
import { IpfsModuleTypes } from "../ipfs/di/typez.js"
import { IpldRegionMapRepository } from "../plotting/components/IpldRegionMapRepository.js"
import { IpldRegionMapSchemaDsl } from "../plotting/components/IpldRegionMapSchemaDsl.js"
import { PlottingModuleTypes } from "../plotting/di/typez.js"
import { IRegionMapRepository } from "../plotting/interface/IRegionMapRepository.js"
import { PBufRegionMapDecoder } from "../plotting/protobuf/PBufRegionMapDecoder.js"
import { ProtobufAdapter } from "../plotting/protobuf/ProtobufAdapter.js"

export class FsBlockstoreConfiguration {
  constructor (
    public readonly rootPath: string,
    public readonly cacheSize: number
  ) {}
}

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
    .build()

console.log("AA")
console.log(ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE)
console.log("BB")

export class DynamicImportConfig {
  // constructor (public readonly sourceModule: any, public readonly blockstoreProvider: string | symbol) {}
  constructor (public readonly blockStorage: BaseBlockstore) { }
}

const { ConfigurableModuleClass: DynamicRepoBaseModule, MODULE_OPTIONS_TOKEN: MOD_OPT_TOKEN, OPTIONS_TYPE: OPTIONS_TYPE_2, ASYNC_OPTIONS_TYPE: ASYNC_OPTIONS_TYPE_2 } =
  new ConfigurableModuleBuilder<BaseBlockstore, "register", "provideBlockstore">({
    optionsInjectionToken: InjectedBlockstore,
    alwaysTransient: false
  })
    .setClassMethodName("register")
    .setFactoryMethodName("provideBlockstore")
    .build()

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

@Injectable()
export class BlockStoreHolder {
  constructor (
    @Inject(SharedArtBlockStore) private readonly sharedBlockstore: BaseBlockstore
  ) {
    console.log(`Block store holder has ${sharedBlockstore.constructor.name} on construction`)
  }

  public provideBlockstore (): BaseBlockstore {
    return this.sharedBlockstore
  }
}

const dynamicIpfs = IpfsModule.register({ rootPath: "/home/ionadmin/Documents/raBlocks", cacheSize: 500, injectToken: SharedArtBlockStore })

@Module({
  imports: [ dynamicIpfs ],
  providers: [ BlockStoreHolder ],
  exports: [ dynamicIpfs, BlockStoreHolder ]
  })
export class IpfsArtworkStoreModule { }

const AltRepository: unique symbol = Symbol("AltRepository")

@Injectable()
export class AnotherRepository {
  constructor (
    @Inject(SharedArtBlockStore) private readonly sharedBlockstore: BaseBlockstore
  ) {
    console.log(`Block store has ${sharedBlockstore.constructor.name} on construction`)
  }
}

@Module({
  imports: [IpfsArtworkStoreModule],
  providers: [ {
  provide: AltRepository,
  useClass: AnotherRepository
  } ],
  exports: [AltRepository]
  })
export class AltStaticDependencyModule { }

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

@Module({
  imports:[IpfsArtworkStoreModule],
  providers: [
  {
  provide: PlottingModuleTypes.PBufPlotRegionMapDecoder,
  useClass: PBufRegionMapDecoder
  },
  {
  provide: PlottingModuleTypes.IpldRegionMapRepository,
  useClass: IpldRegionMapRepository
  },
  {
  provide: PlottingModuleTypes.IpldRegionMapSchemaDsl,
  useClass: IpldRegionMapSchemaDsl
  },
  {
  provide: PlottingModuleTypes.ProtoBufAdapter,
  useClass: ProtobufAdapter
  },
  ],
  exports: [PlottingModuleTypes.IpldRegionMapRepository, PlottingModuleTypes.ProtoBufAdapter]
  })
// eslint-disable-next-line @typescript-eslint/no-extraneous-class, @typescript-eslint/no-unused-vars
export class PlottingModule { }

@Injectable()
export class AppService {
  constructor (
    @Inject(PlottingModuleTypes.IpldRegionMapRepository)
    private readonly ipldRepo: IRegionMapRepository,
    @Inject(AltRepository)
    private readonly altStaticRepo: AnotherRepository,
    @Inject(InjectedAltRepo)
    private readonly altDynamicRepo: InjectedAltRepository
  ) { }

  public doWork (): void {
    console.log(`Got <${this.ipldRepo.constructor.name}, ${this.altStaticRepo.constructor.name}, ${this.altDynamicRepo.constructor.name}`)
  }
}

@Module({
  imports: [
  AltStaticDependencyModule,
  AltDynamicDependencyModule.registerAsync({
    imports: [ IpfsArtworkStoreModule ],
    useExisting: BlockStoreHolder
    }),
  PlottingModule
  ],
  providers: [AppService],
  exports: [AppService]
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
