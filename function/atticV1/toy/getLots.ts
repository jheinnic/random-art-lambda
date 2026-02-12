import { RandomPrimeField } from "./painting/utility/RandomPrimeField.js"

const field = new RandomPrimeField(48)
const seq = field.rollSequence(5)
while (true) {
   console.log(seq.next().value)
}
