import { AsyncLocalStorage } from "node:async_hooks"

const store: AsyncLocalStorage = new AsyncLocalStorage()
store.enterWith({ thing: 0 })

function outerTop() {
	const objOne = { thing: 1 }

	console.log("Z: ", store.getStore())
	store.enterWith(objOne)

	console.log("A: ", store.getStore())
	console.log("B: ",
		store.run( { thing: 2 }, () => {
			console.log("C: ", store.getStore())
			store.run( {thing: 3}, () => {
				console.log("D: ", store.getStore())
				setTimeout(() => {
					console.log("E: ", store.getStore())
				}, 10)
				return store.getStore()
			})
			console.log("F: ", store.getStore())
			return store.getStore()
		})
	)
	console.log("G: ", store.getStore())
	return(7)
}

outerTop()
