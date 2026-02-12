import { IRepo } from "./IRepo.js"

export class RepoTwo implements IRepo {
   private readonly cache: Record<string, string> = {}

   create(name: string, value: string): void {
      this.cache[name] = value
   }

   retrieve(name: string): string | undefined {
      return this.cache[name]
   }
}
