import {
   Module,
   Injectable,
   Inject,
   ConfigurableModuleBuilder,
} from "@nestjs/common"
import { NestFactory } from "@nestjs/core"

const theBoxApp: unique symbol = Symbol("TheAppBox")

const theBoxOne: unique symbol = Symbol("TheOneBox")
const anotherBoxOne: unique symbol = Symbol("AnotherOneBox")
const theBoxTwo: unique symbol = Symbol("TheTwoBox")
const anotherBoxTwo: unique symbol = Symbol("AnotherTwoBox")
const theBoxThree: unique symbol = Symbol("TheThreeBox")
const anotherBoxThree: unique symbol = Symbol("AnotherThreeBox")

const configOne: unique symbol = Symbol("ConfigOne")
const configTwo: unique symbol = Symbol("ConfigTwo")
const configThree: unique symbol = Symbol("ConfigThree")

@Injectable()
export class Box {
   constructor(public readonly value: number = 25) {}
}

@Injectable()
export class Crate {
   constructor(
      @Inject(theBoxThree)
      public readonly boxOne: Box,
      @Inject(anotherBoxThree)
      public readonly boxTwo: Box,
   ) {}
}

@Injectable()
export class CrateService {
   constructor(public readonly crate: Crate) {}
}

export interface ConfigOne {
   theBox: Box
}

export interface ConfigTwo {
   theBox: Box
   anotherBox: Box
}

export interface ConfigThree {
   theBox: Box
   anotherBox: Box
}

const hostA = new ConfigurableModuleBuilder<ConfigOne>({
   moduleName: "ModuleOne",
   alwaysTransient: false,
   optionsInjectionToken: configOne,
}).build()

const hostB = new ConfigurableModuleBuilder<ConfigTwo>({
   moduleName: "ModuleTwo",
   alwaysTransient: false,
   optionsInjectionToken: configTwo,
}).build()

const hostC = new ConfigurableModuleBuilder<ConfigThree>({
   moduleName: "ModuleThree",
   alwaysTransient: false,
   optionsInjectionToken: configThree,
}).build()

@Module({
   providers: [
      {
         provide: anotherBoxThree,
         useFactory: (config: ConfigThree) => {
            return config.anotherBox
         },
         inject: [configThree],
      },
      {
         provide: theBoxThree,
         useFactory: (config: ConfigThree) => {
            return config.theBox
         },
         inject: [configThree],
      },
      Crate,
   ],
   exports: [Crate],
})
export class ModuleThree extends hostC.ConfigurableModuleClass {}

const sharedProvidersTwo = [
   {
      provide: anotherBoxTwo,
      useFactory: (config: ConfigTwo) => {
         return config.anotherBox
      },
      inject: [configTwo],
   },
   {
      provide: theBoxTwo,
      useFactory: (config: ConfigTwo) => {
         return config.theBox
      },
      inject: [configTwo],
   },
]

@Module({
   imports: [
      ModuleThree.registerAsync({
         // imports: [ModuleTwo],
         useFactory: (x: Box, y: Box) => {
            return {
               theBox: x,
               anotherBox: y,
            }
         },
         inject: [theBoxTwo, anotherBoxTwo],
         provideInjectionTokensFrom: [
            ...sharedProvidersTwo,
            { provide: configTwo, useExisting: configTwo },
         ],
      }),
   ],
   providers: [...sharedProvidersTwo],
   exports: [theBoxTwo, anotherBoxTwo, ModuleThree],
})
export class ModuleTwo extends hostB.ConfigurableModuleClass {}

const sharedProvidersOne = [
   {
      provide: anotherBoxOne,
      useFactory: () => {
         return new Box(150)
      },
   },
   {
      provide: theBoxOne,
      useFactory: (config: ConfigOne) => {
         return config.theBox
      },
      inject: [configOne],
   },
]

@Module({
   imports: [
      ModuleTwo.registerAsync({
         // imports: [ModuleOne],
         useFactory: (x: Box, y: Box) => {
            return {
               theBox: x,
               anotherBox: y,
            }
         },
         inject: [theBoxOne, anotherBoxOne],
         provideInjectionTokensFrom: [...sharedProvidersOne],
      }),
   ],
   providers: [...sharedProvidersOne],
   exports: [theBoxOne, anotherBoxOne, ModuleTwo],
})
export class ModuleOne extends hostA.ConfigurableModuleClass {}

const sharedProvidersApp = [
   {
      provide: theBoxApp,
      useFactory: () => {
         return new Box(100)
      },
   },
]

@Module({
   imports: [
      ModuleOne.registerAsync({
         // imports: [AppModule],
         useFactory: (x: Box) => {
            return {
               theBox: x,
            }
         },
         inject: [theBoxApp],
         provideInjectionTokensFrom: [...sharedProvidersApp],
      }),
   ],
   providers: [...sharedProvidersApp, CrateService],
   exports: [theBoxApp, CrateService],
})
export class AppModule {}

async function bootstrap(): Promise<void> {
   const app = await NestFactory.createApplicationContext(AppModule)
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
