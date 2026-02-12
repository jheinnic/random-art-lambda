import { Inject, OnApplicationBootstrap } from "@nestjs/common"
import { IRepo } from "./IRepo.js"
import { SatisfiableDependency } from "../SatisfiableDependency.js"
import { ServiceModuleTypes } from "./ServiceModuleTypes.js"

export class Service implements OnApplicationBootstrap {
   private injectedRepo?: IRepo

   constructor(
      @Inject(ServiceModuleTypes.RepoProducer)
      private readonly repoProducer: SatisfiableDependency<IRepo>,
   ) {}

   private get repo(): IRepo {
      if (this.injectedRepo == null) {
         throw new Error("Application has not yet bootstrapped")
      }
      return this.injectedRepo
   }

   async onApplicationBootstrap(): Promise<void> {
      this.injectedRepo = await this.repoProducer.provide()
   }

   public doSongAndDance(): string {
      this.repo.create("song", "dance")
      this.repo.create("dance", "song")
      return `${this.repo.retrieve("dance") ?? "BAD"} and ${this.repo.retrieve("song") ?? "BAD"}`
   }
}
