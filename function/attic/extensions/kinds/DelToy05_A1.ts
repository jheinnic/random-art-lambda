import { Commodity } from "./DelToy03"

export class StandardNotebooks implements Commodity<"Notebook"> {
   static readonly extensionFor: "Conforming" = "Conforming"
   static readonly extensionId: "Notebook" = "Notebook"

   public readonly vendor: "Notebook" = "Notebook"
   constructor(
      public readonly sku: string,
      public readonly sizes: number,
   ) {}

   public sayIt(): void {
      console.log(`We want to buy a ${this.vendor}`)
   }
}

export class StandardBlenders implements Commodity<"Blender"> {
   static readonly extensionFor: "Conforming" = "Conforming"
   static readonly extensionId: "Blender" = "Blender"

   public readonly vendor: "Blender" = "Blender"
   constructor(
      public readonly sku: string,
      public readonly sizes: number,
   ) {}

   public sayIt(): void {
      console.log(`We want to buy a ${this.vendor}`)
   }
}
