import { ConfigurableModuleBuilder, DynamicModule, Inject, Injectable, Module, Type } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { BaseBlockstore } from "blockstore-core"

import { buildLruCache, FsBlockstore } from "../ipfs/components/FsBlockstore.js"
import { FsBlockstoreConfiguration, IpfsModuleTypes } from "../ipfs/di/index.js"
import { IpldRegionMapRepository } from "../plotting/components/IpldRegionMapRepository.js"
import { IpldRegionMapSchemaDsl } from "../plotting/components/IpldRegionMapSchemaDsl.js"
import { PlottingModuleTypes } from "../plotting/di/index.js"
import { IRegionMapRepository } from "../plotting/interface/index.js"

/**
 * Configuration class used set an externally defined injection token for a given module instance's exposure of an otherwise
 * stock resource token.  It becomes necessary to use this if a given module's dynamic registration may be used multiple times
 * by the same importer, making it necessary for each dynamic import to have a distinct resource token for the artifacts the
 * modules are created to acquire.
 */
export class ModuleInstanceConfiguration {
  constructor (
    public readonly injectToken: symbol | string
  ) {}
}

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } =
  new ConfigurableModuleBuilder<FsBlockstoreConfiguration, "register", "create", ModuleInstanceConfiguration>({
    optionsInjectionToken: IpfsModuleTypes.FsBlockstoreConfig,
    alwaysTransient: true
  })
    .setClassMethodName("register")
    .setFactoryMethodName("create")
    .setExtras(new ModuleInstanceConfiguration(IpfsModuleTypes.AbstractBlockstore), (module: DynamicModule, extras: ModuleInstanceConfiguration): DynamicModule => {
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
      return module
    })
    .build()
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
export class ZpfsModule extends ConfigurableModuleClass {
  static register (config: typeof OPTIONS_TYPE): DynamicModule {
    return super.register(config)
  }

  static registerAsync (options: typeof ASYNC_OPTIONS_TYPE): DynamicModule {
    return super.registerAsync(options)
  }
}

// Next Module //

// const SharedArtBlockStoreDynamicImport: unique symbol = Symbol("DynamicImport<SharedArtworkBlockstore>")
export const InjectedBlockstore: unique symbol = Symbol("InjectedBlockstore")
export const AltRepository: unique symbol = Symbol("AlternateRepository")

@Injectable()
export class AlternateRepository {
  constructor (
    @Inject(InjectedBlockstore) private readonly sharedBlockstore: BaseBlockstore
  ) {
    console.log(`Injected repository has ${sharedBlockstore.constructor.name} on construction`)
  }
}

const { ConfigurableModuleClass: Dynamic2RepoBaseModule } = // MODULE_OPTIONS_TOKEN: MOD_OPT_TOKEN, OPTIONS_TYPE: OPTIONS_TYPE_2, ASYNC_OPTIONS_TYPE: ASYNC_OPTIONS_TYPE_2 } =
  new ConfigurableModuleBuilder<BaseBlockstore, "register">({
    optionsInjectionToken: InjectedBlockstore,
    alwaysTransient: false
  })
    .setClassMethodName("register")
    .build()

@Module({
  imports: [],
  providers: [
  {
  provide: AltRepository,
  useClass: AlternateRepository
  }
  ],
  exports: [AltRepository]
  })
export class AltDynamicDependency2Module extends Dynamic2RepoBaseModule {
  // public static registerAsync (options: typeof ASYNC_OPTIONS_TYPE_2): DynamicModule {
  // return super.registerAsync(options)
  // }
}

// Next Module //

const SharedArtBlockStore: unique symbol = Symbol("SharedArtworkBlockstore")

@Module({
  imports: [ ZpfsModule.register({ rootPath: "/home/ionadmin/Documents/raBlocks", cacheSize: 500, injectToken: SharedArtBlockStore }) ],
  exports: [ZpfsModule]
  })
export class SharedArtBlockstoreModule {
}

// Next Module //

@Injectable()
export class AppService {
  constructor (
    @Inject(AltRepository)
    private readonly altDynamicRepo: AlternateRepository,
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
  SharedArtBlockstoreModule,
  AltDynamicDependency2Module.registerAsync({
    imports: [SharedArtBlockstoreModule],
    useFactory: (blockStore) => {
    return blockStore
    },
    inject: [SharedArtBlockStore]
    })
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
