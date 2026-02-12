import { Compo } from "./BaseCompo.js"
import "./ExtCompo.js"

const foo: Compo = new Compo({ id: 7 })
console.log(foo.id)
console.log(foo)

const bar: Compo = new Compo({ id: 23, name: "Bob" })
console.log(bar)
console.log(bar.id)
console.log(bar.name)
console.log(foo.name)
console.log(foo)
