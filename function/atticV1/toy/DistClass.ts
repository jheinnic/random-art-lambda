export abstract class Base {
   public abstract readonly kind: string
   protected constructor() {
      if (this !== null) {
         console.log("this")
      }
   }
}

export class AType extends Base {
   public readonly aStr: string = "A"
   public readonly kind: "A" = "A"

   public constructor() {
      super()
   }
}

export class BType extends Base {
   public readonly bStr: string = "B"
   public readonly kind: "B" = "B"

   public constructor() {
      super()
   }
}

export class CType extends Base {
   public readonly cStr: string = "C"
   public readonly kind: "C" = "C"

   public constructor() {
      super()
   }
}

export type Bases = AType | BType | CType

function foo(thing: Bases): void {
   switch (thing.kind) {
      case "A": {
         console.log(thing.aStr)
         break
      }
      case "B": {
         console.log(thing.bStr)
         break
      }
      case "C": {
         console.log(thing.cStr)
         break
      }
   }
}

let thing: Bases = new AType()
foo(thing)
thing = new CType()
foo(thing)
