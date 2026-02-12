import { Module } from "@nestjs/common"
import { ServiceModule } from "./ServiceModule.js"
import { RepoTwo } from "./RepoTwo.js"
import { IRepo } from "./IRepo.js"
import { SatisfiableDependency } from "../SatisfiableDependency.js"
import { ServiceModuleTypes } from "./ServiceModuleTypes.js"

@Module({
   imports: [ServiceModule.forRoot()],
   providers: [
      RepoTwo,
      {
         provide: "Injection",
         useFactory: (
            dep: SatisfiableDependency<IRepo>,
            repo: IRepo,
         ): object => {
            return dep.satisfy(repo)
         },
         inject: [ServiceModuleTypes.RepoConsumer, RepoTwo],
      },
   ],
   exports: [ServiceModule],
})
export class AppModule {}

type XX = Omit<object, "use">
export let a: object = { use: "x" }
export let b: XX = { use: "x" }
b = a
a = b
