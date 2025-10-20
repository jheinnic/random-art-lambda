import { OnApplicationBootstrap, OnModuleInit } from "@nestjs/common"
import { IGenModelFactory } from "../../seeding/interface/IGenModelFactory.js"
import {
   IGenModelSeedRegistry,
   SeedKey,
} from "../../seeding/interface/IGenModelSeedRegistry._st"
import { GenModel } from "./genjs6.js"

export class GenModelFactory
   implements
      OnModuleInit,
      OnApplicationBootstrap,
      IGenModelFactory,
      IGenModelSeedRegistry
{
   initDone: boolean = false
   seedGenModel(key: string): GenModel {
      if (!this.initDone) {
         throw new Error("Not done initializing yet")
      }
   }

   registerSeedType<K extends string, T extends SeedKey<K>>(
      key: K,
      txFn: (arg0: T) => string,
   ): void {
      if (this.initDone) {
         throw new Error("Initialization is already done")
      }
   }
   onModuleInit() {
      throw new Error("Method not implemented.")
   }
   onApplicationBootstrap() {
      throw new Error("Method not implemented.")
   }
}

type FullArray<K extends string, Partial extends string[] = []> =
   