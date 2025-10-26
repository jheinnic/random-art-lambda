import { SeedByExtension } from "../models/SeedByExtension.js"

export interface IGenModelSeedStaticExtension<ExtensionId extends string> {
   readonly seedModelType: SeedByExtension<ExtensionId>
}
