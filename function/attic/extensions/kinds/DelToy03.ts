import "./DelToy01.js"

export interface BakedGood {
   readonly temperature: number
   readonly bundleCount: number
   readonly label: string
}

export interface AutoPart {
   readonly make: string
   readonly model: string
   readonly productionYear: number
}

export interface Commodity<TaxId extends string> {
   readonly vendor: TaxId
   readonly sku: string
   readonly sizes: number
}
