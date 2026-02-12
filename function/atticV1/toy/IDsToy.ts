import { monotonicFactory } from "ulid"
import {
   getMyULIDFactory,
   seedULIDPrng,
   generateULID,
} from "./painting/utility/ULIDFactory.js"
import { getMyPrimeField } from "./painting/utility/RandomPrimeField.js"

const ulid = getMyULIDFactory()
const ulid2 = getMyULIDFactory()
console.log(ulid === ulid2)

let data = new Array(100)
data.fill(0)
data = data.map((x) => {
   return [ulid(), ulid2()]
})
console.log(data)

console.log(ulid())
console.log(ulid2())
console.log(ulid())
console.log(ulid2())
console.log(ulid())
console.log(ulid2())
console.log(ulid())
console.log(ulid2())
console.log(ulid())
console.log(ulid2())

const prime = getMyPrimeField()
const prng: any = seedULIDPrng(prime)
const ulid3 = monotonicFactory(prng)
const ulid4 = monotonicFactory(prng)
const now = Date.now()

data = data.map((x, idx) => {
   return [ulid3(now + idx), ulid4(now + idx)]
})
console.log(data)
