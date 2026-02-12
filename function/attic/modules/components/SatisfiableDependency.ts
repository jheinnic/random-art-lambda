import {
   DynamicModule,
   Injectable,
   OnModuleInit,
   OnApplicationBootstrap,
} from "@nestjs/common"

@Injectable()
export class SatisfiableDependency<Artifact extends object>
   implements OnApplicationBootstrap, OnModuleInit
{
   private readonly promise: Promise<Artifact>
   private resolve: undefined | ((artifact: Artifact) => void)
   private reject: undefined | ((error: any) => void)
   private postModuleInit: boolean = false

   constructor() {
      let resolveFn: undefined | ((artifact: Artifact) => void)
      let rejectFn: undefined | ((error: any) => void)
      this.promise = new Promise(
         (
            resolve: (artifact: Artifact) => void,
            reject: (error: any) => void,
         ): void => {
            resolveFn = resolve
            rejectFn = reject
         },
      )
      this.resolve = resolveFn
      this.reject = rejectFn
   }

   static extendDynamicModule(
      module: DynamicModule,
      asProviderToken: symbol | string,
      asSupplierToken: symbol | string,
   ): DynamicModule {
      return {
         ...module,
         providers: [
            ...(module.providers ?? []),
            {
               provide: asSupplierToken,
               useClass: SatisfiableDependency,
            },
            {
               provide: asProviderToken,
               useExisting: asSupplierToken,
            },
         ],
         exports: [
            ...(module.exports ?? []),
            {
               provide: asSupplierToken,
               useClass: SatisfiableDependency,
            },
         ],
      }
   }

   async provide(): Promise<Artifact> {
      if (!this.postModuleInit) {
         throw new Error(
            "Satisfiable dependencies are only available during application bootstrap, after module initialization.",
         )
      }
      return await this.promise
   }

   satisfy(artifact: Artifact): object {
      if (this.resolve == null) {
         throw new Error(
            "Satisfiable dependency has already been satisfied or failed.",
         )
      }
      this.resolve(artifact)
      this.resolve = undefined
      this.reject = undefined
      return {}
   }

   fail(error: Error): void {
      if (this.reject == null) {
         throw new Error(
            "Satisfiable dependency has already been satisfied or failed.",
         )
      }
      this.reject(error)
      this.resolve = undefined
      this.reject = undefined
   }

   onModuleInit(): void {
      this.postModuleInit = true
   }

   onApplicationBootstrap(): void {
      if (this.reject != null) {
         this.reject(
            new Error(
               "Satisfiable dependency still not provided at application bootstrap",
            ),
         )
         this.resolve = undefined
         this.reject = undefined
      }
   }
}
