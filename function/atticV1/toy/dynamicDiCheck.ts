/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { NestFactory } from "@nestjs/core"
import {
   Inject,
   Provider,
   Module,
   Injectable,
   DynamicModule,
   OnModuleInit,
   INestApplicationContext,
} from "@nestjs/common"

export class Builder {
   private readonly names: Map<string, symbol> = new Map<string, symbol>()
   private readonly users: Map<string, Map<string, (arg: object) => void>> =
      new Map<string, Map<string, (arg: object) => void>>()

   provide(name: string, sym: symbol): void {
      this.names.set(name, sym)
   }

   use(name: string, dep: string, fn: (arg: object) => void): void {
      const deps = new Map<string, (arg: object) => void>()
      deps.set(dep, fn)
      this.users.set(name, deps)
   }

   build(): Provider {
      const propName = this.names.keys().next().value
      const propSym = this.names.get(propName)!
      const methodName = this.users.keys().next().value
      //   const method = this.users.get(methodName)!.values().next().value
      const method = this.users.get(methodName)!.get(propName)!

      return {
         provide: "Thing",
         useFactory: (injected: object) => {
            const retVal: any = {}
            retVal[propName] = injected
            retVal[methodName] = method
            method(injected)
            return retVal
         },
         inject: [propSym],
      }
   }
}

export const leafSymbol: unique symbol = Symbol("Leaf")

@Injectable()
export class LeafPart {}

@Injectable()
export class AppService {
   constructor(@Inject("Thing") private readonly thing: object) {}

   doIt(): void {
      console.log("Done It")
      console.log(this.thing)
   }
}

@Module({})
export class LeafModule implements OnModuleInit {
   public static INST: DynamicModule = {
      module: LeafModule,
      imports: [],
      providers: [],
      exports: [],
   }

   private static BLDR: undefined | Builder

   static forRoot(bldr: Builder): DynamicModule {
      LeafModule.BLDR = bldr
      return LeafModule.INST
   }

   onModuleInit(): void {
      console.log("onModuleInit Leaf")
      LeafModule.INST.providers = [
         {
            provide: leafSymbol,
            useClass: LeafPart,
         },
      ]
      LeafModule.INST.exports = [leafSymbol]
      LeafModule.BLDR!.provide("leafy", leafSymbol)
   }
}

@Module({})
export class StepModule implements OnModuleInit {
   public static INST: DynamicModule = {
      module: StepModule,
      imports: [LeafModule.INST],
      providers: [],
      exports: [LeafModule],
   }

   private static BLDR: undefined | Builder

   static forRoot(bldr: Builder): DynamicModule {
      StepModule.BLDR = bldr
      return StepModule.INST
   }

   onModuleInit(): void {
      console.log("onModuleInit Step")
      StepModule.BLDR!.use("steppy", "leafy", (x: object) => {
         console.log("Injected with :: ", x)
      })
      StepModule.INST.exports = [LeafModule, StepModule]
   }
}

@Module({})
export class AppModule implements OnModuleInit {
   public static INST: DynamicModule = {
      module: AppModule,
      imports: [StepModule.INST],
      providers: [AppService],
      exports: [AppService],
   }

   private static BLDR: undefined | Builder

   static forRoot(bldr: Builder): DynamicModule {
      AppModule.BLDR = bldr
      return AppModule.INST
   }

   onModuleInit(): void {
      AppModule.INST.providers!.unshift(AppModule.BLDR!.build())
      console.log("onModuleInit App")
   }
}

async function bootstrap(): Promise<void> {
   const builder: Builder = new Builder()
   LeafModule.forRoot(builder)
   StepModule.forRoot(builder)

   const app: INestApplicationContext =
      await NestFactory.createApplicationContext(AppModule.forRoot(builder))
   const appService = app.get(AppService)
   console.log(appService.doIt())
}

await bootstrap()
