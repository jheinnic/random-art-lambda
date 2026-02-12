var Benchmark = require('benchmark')
var seedrandom = require('seedrandom')
var rpf = require('../../dist/painting/utility/RandomPrimeField.js')
var RandomPrimeField = rpf.RandomPrimeField

var p = new RandomPrimeField(36)
var seq = p.rollSequence(8)
var rng = seedrandom('Hello!')

var suite = new Benchmark.Suite;

// add tests
suite.add('RandomPrimeGenerator', function() {
  return seq.next().value
})
.add('seedrandom', function() {
  return (255 + (rng.int32() % 256)) % 256 
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


