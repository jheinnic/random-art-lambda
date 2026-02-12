import { S3, S3Client } from "@aws-sdk/client-s3"
import { Nullable } from "simplytyped"
import type {
   AssertiveClient,
   GetOutputType,
   InvokeMethod,
   InvokeMethodOptionalArgs,
   NoUndefined,
   RecursiveRequired,
   UncheckedClient,
} from "@smithy/types"

type NarrowClientIOTypes<ClientType extends object> = {
   [key in keyof ClientType]: [ClientType[key]] extends [
      InvokeMethodOptionalArgs<
         infer FunctionInputTypes,
         infer FunctionOutputTypes
      >,
   ]
      ? InvokeMethodOptionalArgs<
           NoUndefined<FunctionInputTypes>,
           NoUndefined<FunctionOutputTypes>
        >
      : [ClientType[key]] extends [
             InvokeMethod<infer FunctionInputTypes, infer FunctionOutputTypes>,
          ]
        ? InvokeMethod<
             NoUndefined<FunctionInputTypes>,
             NoUndefined<FunctionOutputTypes>
          >
        : ClientType[key]
}

type UncheckedClientOutputTypes<ClientType extends object> = {
   [key in keyof ClientType]: [ClientType[key]] extends [
      InvokeMethodOptionalArgs<
         infer FunctionInputTypes,
         infer FunctionOutputTypes
      >,
   ]
      ? InvokeMethodOptionalArgs<
           NoUndefined<FunctionInputTypes>,
           RecursiveRequired<FunctionOutputTypes>
        >
      : [ClientType[key]] extends [
             InvokeMethod<infer FunctionInputTypes, infer FunctionOutputTypes>,
          ]
        ? InvokeMethod<
             NoUndefined<FunctionInputTypes>,
             RecursiveRequired<FunctionOutputTypes>
          >
        : ClientType[key]
}
export {}

const s3a: AssertiveClient<S3> = new S3({}) as AssertiveClient<S3>
const s3b: UncheckedClient<S3> = new S3({}) as UncheckedClient<S3>
const s3c: S3 = new S3({})

// AssertiveClient enforces required inputs are not undefined
// and required outputs are not undefined.
const getA = (
   await s3a.getObject({
      Bucket: "",
      Key: "undefined",
   })
).Body.transformToString()
const getB = (
   await s3b.getObject({
      Bucket: "",
      Key: "undefined",
   })
).Body.transformToString()
const getC = await s3c.getObject({
   Bucket: "",
   Key: undefined,
}) // .Body.transformToString()

const s3Client = new S3Client({
   region: "auto",
})

export function foody(data?: string): void {
   console.log(data)
   if (data === null) {
      console.log("Null")
   } else if (data.length > 0) {
      console.log("Big1")
   }
   if (data === undefined) {
      console.log("Undefined")
   } else if (data.length > 0) {
      console.log("Big2")
   }
}

export function moody(data: string): void {
   console.log(data)
   if (data === null) {
      console.log("Null")
   } else if (data.length > 0) {
      console.log("Big1")
   }
   if (data === undefined) {
      console.log("Undefined")
   } else if (data.length > 0) {
      console.log("Big2")
   }
}

export function doody(data: string | undefined): void {
   console.log(data)
   if (data == undefined) {
      console.log("Undefined")
   } else if (data.length > 0) {
      console.log("Big2")
   }
   if (data != null) {
      console.log("Real")
   }
   if (data !== null) {
      console.log("Realish")
   } else {
      console.log("Not realish", data)
   }
   if (data == null) {
      console.log("Null")
   } else if (data.length > 0) {
      console.log("Big1")
   }
}

export function koody(data: Nullable<string>): void {
   if (data == null) {
      console.log(data, " == null")
   }
   if (data == undefined) {
      console.log(data, " == undefined")
   }
   if (data === null) {
      console.log(data, " === null")
   }
   if (data === undefined) {
      console.log(data, " === undefined")
   }
   if (data != null) {
      console.log(data, " != null")
   }
   if (data != undefined) {
      console.log(data, " != undefined")
   }
   if (data !== null) {
      console.log(data, " !== null")
   }
   if (data !== undefined) {
      console.log(data, " !== undefined")
   }
   if (data) {
      console.log("Double Not")
   }
   if (!data) {
      console.log("Not")
   }
   if (datal) {
      console.log("Is")
   }
}

export function woody(data: Nullable<string>): void {
   console.log(data)
   if (data != null) {
      console.log("Real")
   }
   if (data === null) {
      console.log("Null")
   } else if (data.length > 0) {
      console.log("Big1")
   }
   if (data === undefined) {
      console.log("Undefined")
   } else if (data.length > 0) {
      console.log("Big2")
   }
}

/*
foody()
foody(null)
foody(undefined)
foody("abc")

moody()
moody(null)
moody(undefined)
moody("abc")

doody()
doody(null)
doody(undefined)
doody("abc")

woody()
woody(null)
woody(undefined)
woody("abc")
*/

interface CoreObject {
   add: (a: number, b: number) => number
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface CandyCane extends Delegate<MyStaticInterface, CoreObject> {}

interface MyStaticInterface {
   new (): any // The constructor
   version: (this: CandyCane, name: string) => string // A static property
   generateId: (this: CandyCane, num: Number) => number // A static method
}

type WrapableStatic<T extends object, S extends object> = keyof T extends {
   [K in keyof T]: [T[K]] extends [(this: S, ...args: any[]) => any] ? K : never
}[keyof T]
   ? T
   : never

type Delegate<T extends object, B extends object> =
   T extends WrapableStatic<T, any>
      ? {
           [K in keyof T]: [T[K]] extends [
              (this: any, ...args: infer P) => infer R,
           ]
              ? (...args: P) => R
              : never
        } & B
      : never

type DelegatableStatic<
   T extends object,
   B extends object,
   D extends Delegate<T, B>,
> = T extends WrapableStatic<T, D> ? T : never

const a: MyStaticInterface = {} as unknown as MyStaticInterface
const b: DelegatableStatic<MyStaticInterface, CoreObject, CandyCane> = a
const c: CandyCane = {
   version(name: string): string {
      return name
   },

   generateId(num: Number): number {
      return 52
   },

   add(a: number, b: number): number {
      return a + b
   },
}

class CandyCaneWrapper implements CandyCane {
   private readonly delegatee: MyStaticInterface & CoreObject
   constructor(delegatee: MyStaticInterface) {
      this.delegatee = {
         version: delegatee.version.bind(this),
         generateId: delegatee.generateId.bind(this),
         add: this.add,
         // prototype: delegatee.prototype,
      } as unknown as MyStaticInterface & CoreObject
   }

   version(name: string): string {
      return this.delegatee.version(name)
   }

   generateId(num: Number): number {
      return this.delegatee.generateId(num)
   }

   add(a: number, b: number): number {
      return a + b
   }
}
