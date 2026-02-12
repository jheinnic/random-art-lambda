function *begin(): Generator<string, object, number> {
	const source = "abcdefg".split('')
	for (let item of source) {
		const back: number = yield item
		console.log('GenFunc: On sending ', item, ' got back ', back.toString(10))
	}
	return { "the": "end" }
}

const workGen = begin();
const replies = [null, "1", "2", "3", "4", "5", "6", "7"]
let value

for (let item of replies) {
	const generated = workGen.next(item);
	console.log("App: Offered ", item, " while receiving", generated)
	value = generated
}
console.log("App: ", JSON.stringify(value))
const last = workGen.next(-1);
console.log("App: ", JSON.stringify(last))

let ii = 0;
const workGenTwo = begin();
let done = false;
while (! done) {
	const reply = workGenTwo.next(ii)
	console.log("App: Offered ", ii, " while receiving ", reply.value, "; ", reply.done)
	value = reply
	done = reply.done
	ii = ii + 1
}
// const lastTwo = workGenTwo.next(-1);
console.log("App: ", JSON.stringify(value))
