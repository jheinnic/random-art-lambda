/**
 * First attempt to create dynamic modules a different way.   This used generics to declare the
 * signature types and then required implementing and supplying providers to satisfy that contract.
 * The Module could then be used to inject the provided dependencies.
 *
 * No provision for imports and very low automation return.  Later replaced by the SimpleDynamicModule
 * and its DynamicModuleBlueprint that was later reused as a part of InjectableModuleClassFactory as
 * well.
 */
import {
   Module,
   Injectable,
   Inject,
   Provider,
   DynamicModule,
} from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { LegacyConduitModuleFactory } from "./modules/di/LegacyConduitModuleFactory.js"

const theBoxApp: unique symbol = Symbol("TheAppBox")

const theBoxOne: unique symbol = Symbol("TheOneBox")
const anotherBoxOne: unique symbol = Symbol("AnotherOneBox")
const theBoxTwo: unique symbol = Symbol("TheTwoBox")
const anotherBoxTwo: unique symbol = Symbol("AnotherTwoBox")
const theBoxThree: unique symbol = Symbol("TheThreeBox")
const anotherBoxThree: unique symbol = Symbol("AnotherThreeBox")

const theBox: unique symbol = Symbol("TheBox")
const anotherBox: unique symbol = Symbol("AnotherBox")

@Injectable()
export class Box {
   constructor(public readonly value: number = 25) {}
}

@Injectable()
export class Crate {
   public readonly value: number = Math.random()
   constructor(
      @Inject(theBoxThree)
      public readonly boxOne: Box,
      @Inject(anotherBoxThree)
      public readonly boxTwo: Box,
   ) {
      console.log("This crate is: " + this.value.toString())
   }
}

@Injectable()
export class CrateService {
   constructor(public readonly crate: Crate) {}
}

export interface ConfigOne {
   theBox: DynamicModule
}

export interface ConfigTwo {
   theBox: DynamicModule
   anotherBox: DynamicModule
}

export interface ConfigThree {
   theBox: DynamicModule
   anotherBox: DynamicModule
}

@Module({})
class TheBoxConduitModule extends new LegacyConduitModuleFactory<[Box]>(
   "TheBoxConduitModule",
   [theBox],
).build() {}

@Module({})
class AnotherBoxConduitModule extends new LegacyConduitModuleFactory<[Box]>(
   "AnotherBoxConduitModule",
   [anotherBox],
).build() {}

@Module({})
export class ModuleThree {
   public static register(config: ConfigThree): DynamicModule {
      return {
         module: ModuleThree,
         imports: [config.theBox, config.anotherBox],
         providers: [
            {
               provide: anotherBoxThree,
               useFactory: (anotherBox: Box): Box => anotherBox,
               inject: [anotherBox],
            },
            {
               provide: theBoxThree,
               useFactory: (theBox: Box): Box => theBox,
               inject: [theBox],
            },
            Crate,
         ],
         exports: [Crate],
      }
   }
}

@Module({})
export class ModuleTwo {
   public static register(config: ConfigTwo): DynamicModule {
      return {
         module: ModuleTwo,
         imports: [
            config.theBox,
            config.anotherBox,
            ModuleThree.register({
               theBox: config.theBox,
               anotherBox: config.anotherBox,
            }),
         ],
         providers: [
            {
               provide: anotherBoxTwo,
               useExisting: anotherBox,
            },
            {
               provide: theBoxTwo,
               useExisting: theBox,
            },
         ],
         exports: [theBoxTwo, anotherBoxTwo, ModuleThree],
      }
   }
}

const sharedProvidersOne: [Provider<Box>] = [
   {
      provide: anotherBoxOne,
      useFactory: () => {
         console.log("Created the 150 box")
         return new Box(150)
      },
   },
]
const anotherBoxConduit: DynamicModule =
   AnotherBoxConduitModule.forProviders(sharedProvidersOne)

@Module({
   imports: [anotherBoxConduit],
   providers: [],
   exports: [],
})
export class ModuleOne {
   public static register(config: ConfigOne): DynamicModule {
      return {
         module: ModuleOne,
         imports: [
            config.theBox,
            ModuleTwo.register({
               theBox: config.theBox,
               anotherBox: anotherBoxConduit,
            }),
         ],
         providers: [
            {
               provide: theBoxOne,
               useExisting: theBox,
            },
         ],
         exports: [theBoxOne, ModuleTwo],
      }
   }
}

const sharedProvidersApp: [Provider<Box>] = [
   {
      provide: theBoxApp,
      useFactory: () => {
         console.log("Created the 100 box")
         return new Box(100)
      },
   },
]
const theBoxConduit: DynamicModule =
   TheBoxConduitModule.forProviders(sharedProvidersApp)

@Module({
   imports: [
      theBoxConduit,
      ModuleOne.register({
         theBox: theBoxConduit,
      }),
   ],
   providers: [CrateService],
   exports: [CrateService],
})
export class AppModule {}

async function bootstrap(): Promise<void> {
   const app = await NestFactory.createApplicationContext(AppModule)
   const theBoxAppA = app.get(theBoxApp)
   const theBoxOneA = app.get(theBoxOne)
   const anotherBoxOneA = app.get(anotherBoxOne)
   const theBoxTwoA = app.get(theBoxTwo)
   const anotherBoxTwoA = app.get(anotherBoxTwo)
   const theBoxThreeA = app.get(theBoxThree)
   const anotherBoxThreeA = app.get(anotherBoxThree)
   console.log([
      theBoxAppA,
      theBoxOneA,
      anotherBoxOneA,
      theBoxTwoA,
      anotherBoxTwoA,
      theBoxThreeA,
      anotherBoxThreeA,
   ])
   const appSvc = app.get(CrateService)
   console.log(appSvc)
   console.log(appSvc.crate)
   console.log(appSvc.crate.boxOne)
   console.log(appSvc.crate.boxOne.value)
   console.log(appSvc.crate.boxTwo)
   console.log(appSvc.crate.boxTwo.value)
   console.log("Done")
}

bootstrap().catch((x: unknown): void => console.error(x))
