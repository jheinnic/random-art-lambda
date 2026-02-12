import { IRepo } from "./IRepo.js"

export class RepoOne implements IRepo {
   private readonly cache: Map<string, string> = new Map()

   create(name: string, value: string): void {
      this.cache.set(name, value)
   }

   retrieve(name: string): string | undefined {
      return this.cache.get(name)
   }
}
