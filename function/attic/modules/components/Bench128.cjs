var Benchmark = require('benchmark')
var seedrandom = require('seedrandom')
var rpf = require('../../dist/painting/utility/RandomPrimeField.js')
var RandomPrimeField = rpf.RandomPrimeField

var p = new RandomPrimeField(48)
var seq = p.rollSequence(128)
var rng = seedrandom('Hello!')
var shifts = [96n, 64n, 32n, 0n]

var suite = new Benchmark.Suite;

// add tests
suite.add('RandomPrimeGenerator', function() {
  return seq.next().value
})
.add('seedrandom', function() {
  var parts = [rng.int32(), rng.int32(), rng.int32(), rng.int32()]
  var ii = 0
  while (ii < 4) {
    if (parts[ii] < 0) {
       parts[ii] = BigInt(parts[ii] * -1) << shifts[ii]
    } else {
       parts[ii] = BigInt(parts[ii]) << shifts[ii]
    }
    ii = ii + 1
  }
  return parts[0] | parts[1] | parts[2] | parts[3]
})
// add listeners
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
})
// run async
.run({ 'async': true });


