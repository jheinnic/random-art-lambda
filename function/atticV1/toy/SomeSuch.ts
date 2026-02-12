type Silly = "A" | "B" extends "A" | "B" ? 2 : 3
type Sally<X, Y> = X extends Y ? 2 : 3
type AA = "A" | "B"
type BB = "A" | "B"
type SAL = Sally<AA, "B">
type SoL = Sally<"A", BB>

interface A<T extends string> {
   in: (input: T) => number
   out: (output: string) => T
}

interface B<T extends string> {
   here: (input: T) => number
   there: (output: string) => T
}

interface Block {
   left: 1
   right: 2
   up: 3
   down: 4
}

// type C<T extends string> = { now: Block[Extract<T, keyof Block>] } & T
type C<T extends string> = Block[Extract<T, keyof Block>]

type Bar = C<"up" | "right">

type D<T extends string> = A<T> & C<T>
type DD<T extends string> = {
   [K in T]: A<K> & C<K>
}[T]
type E<T extends string> = A<T> & B<T>
type EE<T extends string> = {
   [K in T]: A<K> & B<K>
}[T]
type DED<T extends string> = {
   [K in T]: K
}[T]

type LA = DD<"up" | "right">
type LO = (A<"up"> | A<"right">) & C<"right">
type LI = (A<"up"> | A<"right">) & C<"up">
type LAA = D<DED<"up" | "right">>

export const zoo: D<"up"> = {
   now: 3,
   in: (input: "up") => 3,
   out: (output: string) => "up",
   here: (input: "up") => 3,
   there: (output: string) => "up",
}

function quidit(inn: A<"up"> | A<"right">): inn is LI {
   return true
}

function quodit(inn: A<"up"> | A<"right">): inn is LO {
   return true
}

function quoidit(inn: A<"up"> | A<"right">): inn is LO & LI {
   return true
}

function quiodit(inn: A<"up"> | A<"right">): inn is LO | LI {
   return true
}

function quadit(inn: A<"up"> | A<"right">): inn is LA {
   return true
}

export const bjk: EE<"up" | "right"> = {
   in: (input: "up"): number => 3,
   out: (output: string): "up" => "up",
   here: (input: "right"): number => 3,
   there: (output: string): "right" => "right",
}

export let kub: EE<"up" | "right"> = {
   in: (input: "up" | "right"): number => 3,
   out: (output: string): "up" => "up",
   here: (input: "right" | "up"): number => 3,
   there: (output: string): "up" => "up",
}
export let krb: EE<"up" | "right"> = {
   in: (input: "right" | "right"): number => 3,
   out: (output: string): "right" => "right",
   here: (input: "right" | "right"): number => 3,
   there: (output: string): "right" => "right",
}
export let kob: EE<"up" | "right">
export let ksb: (A<"up"> & B<"up">) | (A<"right"> & B<"right">)
export let knv: EE<"up">
export let jwq: EE<"right">
kub = { ...kub }
knv = krb
jwq = kub
kob = kub
kub = krb
krb = kob
kob = kub
ksb = krb
ksb = kub
ksb = krb
knv = kub
knv = ksb
knv = krb
ksb = kob
jwq = kub
jwq = krb
jwq = ksb
jwq = kub
jwq = knv

type LILA = (A<"up"> & B<"up"> & A<"right"> & 2) | (A<"up"> & B<"up"> & 3)
type LALI =
   | (A<"right"> & B<"right"> & 2)
   | (A<"right"> & B<"right"> & A<"up"> & 3)
type LALA = DD<"up" | "right"> & EE<"up" | "right">
const p: LALA = {} as unknown as LALA
const q: LA = p
console.log(q)

const kjd: LALA = knv
const keb: EE<"right"> = kob
const kjq: EE<"up"> = kob
const oje: EE<"right" | "up"> = kob
const kjb: EE<"right" | "up"> = {} as unknown as EE<"right" | "up">

if (quidit(kjb)) {
   const qa: LA = kjb
   console.log(qa)
   const qo: LO = kjb
   console.log(qo)
   const qi: LI = kjb
   console.log(qi)
   const qoi: LO & LI = kjb
   console.log(qoi)
   const qio: LO | LI = kjb
   console.log(qio)
}

if (quidit(kjb) && quodit(kjb)) {
   const qa: LA = kjb
   console.log(qa)
   const qo: LO = kjb
   console.log(qo)
   const qi: LI = kjb
   console.log(qi)
   const qoi: LO & LI = kjb
   console.log(qoi)
   const qio: LO | LI = kjb
   console.log(qio)
}

if (quadit(kjb) && quadit(kjb)) {
   const qa: LA = kjb
   console.log(qa)
   const qaa: LAA = kjb
   console.log(qaa)
   const qaq: LALA = kjb
   console.log(qaq)
   const qaiq: LALI = kjb
   console.log(qaiq)
   const qiaq: LILA = kjb
   console.log(qiaq)
   const qo: LO = kjb
   console.log(qo)
   const qi: LI = kjb
   console.log(qi)
   const qoi: LO & LI = kjb
   console.log(qoi)
   const qio: LO | LI = kjb
   console.log(qio)
}

if (quoidit(kjb)) {
   const qa: LA = kjb
   console.log(qa)
   const qaa: LAA = kjb
   console.log(qaa)
   const qo: LO = kjb
   console.log(qo)
   const qi: LI = kjb
   console.log(qi)
   const qoi: LO & LI = kjb
   console.log(qoi)
   const qio: LO | LI = kjb
   console.log(qio)
}

if (quiodit(kjb)) {
   const qa: LA = kjb
   console.log(qa)
   const qaa: LAA = kjb
   console.log(qaa)
   const qo: LO = kjb
   console.log(qo)
   const qi: LI = kjb
   console.log(qi)
   const qoi: LO & LI = kjb
   console.log(qoi)
   const qio: LO | LI = kjb
   console.log(qio)
}

export const mjs: LA = zoo
export const lkjs: A<"up" & "right"> = zoo
export const voo: LA = {
   // in: (input: "up" | "right") => 3,
   // out: (output: "3") => "up" | "right",
   here: (input: "up" | "right") => 3,
   there: (output: "3") => "up" | "right",
}
