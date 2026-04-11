export class Dependency {
   constructor(
      public readonly foo: string,
      public readonly bar: number,
      private readonly baz: boolean,
   ) {}

   public doing(): string {
      if (this.baz) {
         return this.foo + this.bar.toString() + "!!"
      }

      return this.foo + "::" + this.foo
   }

   public scoper(): number {
      return this.lizer() * this.bar
   }

   private lizer(): number {
      if (this.baz) {
         return this.bar
      }

      return 3
   }
}

export class Testing implements Dependency {
   private readonly baz: boolean = false

   constructor(
      public readonly foo: string,
      public readonly bar: number,
   ) {}

   public doing(): string {
      throw new Error("Method not implemented.")
   }

   public scoper(): number {
      throw new Error("Method not implemented.")
   }

   private lizer(): number {
      return 3
   }
}

type Deeply =
   | string
   | number
   | boolean
   | Deeply[]
   | {
        [K in string]: Deeply
     }

type Primitive = string | number | boolean | Primitive[]

type Skeleton =
   | readonly string[]
   | ReadonlyArray<string | [string, Skeleton]>
   | string

type DeeplyTagged<Skel extends Skeleton = ""> = Skel extends string
   ? Primitive
   : Skel extends readonly string[]
     ? {
          data: { [K in Skel[number]]: Primitive }
          tags: Skel
       }
     : {
          data: {
             [K in Skel[number] extends string
                ? Skel[number]
                : never]: Primitive
          } & {
             [K in Skel[number] extends string
                ? never
                : Skel[number] as K[0]]: DeeplyTagged<K[1]>
          }
          tags: { [K in number]: Skel[K] extends string ? Skel[K] : Skel[K][0] }
       }

type DeepNonFunction<T> = [T] extends [never]
   ? never
   : T extends (...args: any[]) => any
     ? never
     : T extends object
       ? keyof T extends {
            [K in keyof T]: [DeepNonFunction<T[K]>] extends [never] ? never : K
         }[keyof T]
          ? never
          : T
       : T

export const KK: Function = () => {}
export const ah: object = KK

interface TaggedType<Tuple extends readonly string[]> {
   data: {
      [K in Tuple[number]]: Deeply
   }
   tags: Tuple
}

type IsTagged<
   Base extends {
      data: object & Deeply
      tags: readonly string[]
   },
> = Base["tags"] extends infer I extends readonly string[]
   ? Base["data"] extends Record<I[number], Deeply>
      ? TaggedType<I>
      : never
   : never

function isTaggedType<Tags extends readonly string[]>(obj: {
   data: object
   tags: Tags
}): obj is TaggedType<Tags> {
   const keySet: Set<string> = new Set(Object.keys(obj.data))
   const tagSet: Set<string> = new Set(obj.tags)
   for (const setKey of tagSet) {
      if (!keySet.delete(setKey)) {
         return false
      }
   }
   return keySet.size === 0
}
