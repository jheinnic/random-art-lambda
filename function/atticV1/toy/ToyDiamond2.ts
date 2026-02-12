// Interface inheritance as primary specification
interface IBase {
   readonly name: string
}
interface IExtOne extends IBase {
   foo: () => number
}
interface IExtTwo extends IBase {
   bar: () => number
}

interface IExtThree extends IExtOne, IExtTwo {
   biz: () => number
}

// Composition hierarchy -- Each implements one interface's local methods
//                          and receives an injection of each unique base
//                          type in its hierarchy.
// -- Implements any methods it inherits directly or indirectly by delegation
//    to the dependency that implements that method.
// -- Ignores (forbids) overriding inherited methods as a result.  One way to
//    avoid ambiguity in the diamond scenario.
// -- Each subtype that also inherits a common base class will have done the same
//    thing, in this case for the sake of its own potential to have called
//    inherited methods when it was the top-most class in some inheritance
//    chain.  Still relevant for calls through a called method.
// -- The existence of classes at this level establish the minimal composition
//    required to create an instance at each particular point in the inheritance tree,
//    and because the rules lead to the presence of only one "copy" of an inherited
//    type, no matter how many times it is inherited, this enforced constraint on how
//    multiple inheritance is reconciled lends itself naturally to the RandomArt style
//    of progressive dynamic inheritance.
// -- This is not a general purpose solution to Multiple Inheritance.  It is in particular
//    tailored to classes that observe/measure/report external behavior and are characterized
//    by an idempotent nature.
class _Base implements IBase {
   public readonly name: string = this.constructor.name
}

class _ExtOne implements IExtOne {
   constructor(private readonly _base: IBase) {}

   get name(): string {
      return this._base.name
   }

   foo(): number {
      return 5
   }
}

class _ExtTwo implements IExtTwo {
   constructor(private readonly _base: IBase) {}

   get name(): string {
      return this._base.name
   }

   bar(): number {
      return 3
   }
}

class _ExtThree implements IExtThree {
   constructor(
      private readonly base: IBase,
      private readonly extOne: IExtOne,
      private readonly extTwo: IExtTwo,
   ) {}

   get foo(): () => number {
      return this.extOne.foo
   }

   get bar(): () => number {
      return this.extTwo.bar
   }

   get name(): string {
      return this.bar.name
   }

   biz(): number {
      return this.foo() + this.bar()
   }
}

// Concrete realization hierarchy
// -- Injectt themselves at one specific level of the overall hierarchy by instantiating one
//    instance of each dependentt that appears anywhere in the hierarchy, and wiring all
//    shared stakeholders to the same dependent copy that it wires its direct implemetation of
//    itself to.   All implementation details are inheritted from the class it uses as its
//    root.
// -- Inherittance does _not_ manifest between classes.   e.g. ExtThree is unrelated to ExtOne,
//    Base, _ExtOne, and _Base.   It only inherits from _ExtThree, which has no subtypes of
//    its own.  The interface, IExtThree, acquired from _ExtThree, does have subtype relations
//    to both IExtTwo and IExtOne, each of which is a subtype of IBase.
// -- TypeScript can track/see these relationships, but JavaScript loses the Interfaces and
//    therefore has no way of reflecting on subtype relations at runtime unless an until we
//    find a way to acknowledge/repair this...
export class Base extends _Base {
   // eslint-disable-next-line @typescript-eslint/no-useless-constructor
   constructor() {
      super()
   }
}

export class ExtOne extends _ExtOne {
   constructor() {
      const base = new _Base()

      super(base)
   }
}

export class ExtTwo extends _ExtTwo {
   constructor() {
      const base = new _Base()

      super(base)
   }
}

export class ExtThree extends _ExtThree {
   // JavaScript doesn't support this!
   constructor() {
      const base = new _Base()
      const extOne = new _ExtOne(base)
      const extTwo = new _ExtTwo(base)

      super(base, extOne, extTwo)
   }
}

const obj = new ExtThree()
console.log(obj.biz())
