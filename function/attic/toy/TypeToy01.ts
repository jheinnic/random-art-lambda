export type Subst<K extends string> = `l${K}m`
export const dd = "dd"
export type AA = "aa" | "bb" | "cc" | typeof dd
export type BB = Subst<AA>
export type Noc<K extends string> = {
  [P in K as Subst<P>]: boolean
}
const foo: Record<BB, boolean> = {
  laam: true,
  lbbm: false,
  lccm: false,
  lddm: true
}
const woo: Noc<AA> = {
  laam: true,
  lbbm: false,
  lccm: false,
  lddm: true
}
const zoo: Noc<keyof Record<AA, boolean>> = {
  laam: true,
  lbbm: false,
  lccm: false,
  lddm: true
}
const boo: Record<AA, boolean> = {
  aa: false,
  bb: true,
  cc: false,
  dd: true
}

let ii: AA
for (ii of Object.keys(boo) as AA[]) {
  const ii2: Subst<AA> = `l${ii}m`
  foo[ii2] = boo[ii]
  woo[ii2] = boo[ii]
  zoo[ii2] = boo[ii]
}
let jj: AA
for (jj of ["aa", "dd", "cc", "bb"] as AA[]) {
  const ii2: Subst<AA> = `l${jj}m`
  foo[ii2] = boo[jj]
  woo[ii2] = boo[jj]
  zoo[ii2] = boo[jj]
}
