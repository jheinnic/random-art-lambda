import { AutoPart, BakedGood } from "./DelToy03.js"

export class BakeryCatalog implements BakedGood {
   static readonly extensionFor: "Innovating" = "Innovating"
   static readonly extensionId: "BakedGoods" = "BakedGoods"

   constructor(
      public readonly temperature: number,
      public readonly bundleCount: number,
      public readonly label: string,
   ) {}

   public sayIt(): void {
      console.log(
         `We want to buy ${this.bundleCount} of ${this.label} at ${this.temperature}`,
      )
   }
}

export class DealerCatalog implements AutoPart {
   static readonly extensionFor: "Innovating" = "Innovating"
   static readonly extensionId: "AutoParts" = "AutoParts"

   constructor(
      public readonly make: string,
      public readonly model: string,
      public readonly productionYear: number,
   ) {}

   public sayIt(): void {
      console.log(
         `We want to buy a ${this.productionYear} ${this.make} ${this.model}`,
      )
   }
}
