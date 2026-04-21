import { AsyncLocalStorage } from "async_hooks"

const kk = new AsyncLocalStorage();

kk.run( undefined, () => {
	console.log( kk.getStore(), 0, undefined );
kk.run( 12, () => {
	console.log( kk.getStore(), 1, 12 );
	kk.run(undefined, () => {
		console.log( kk.getStore(), 2, undefined )
		kk.run( 21, () => { } )
		console.log( kk.getStore(), 3, undefined );
	});
	console.log( kk.getStore(), 4, 12 );
	kk.run( undefined, () => {
		console.log( kk.getStore(), 5, undefined );
		kk.exit(() => { })
		console.log( kk.getStore(), 15, undefined )
		kk.exit(() => {
			console.log( kk.getStore(), 6, undefined );
			kk.run( 43, () => { } )
			console.log( kk.getStore(), 7, undefined );
		})
		console.log( kk.getStore(), 8, undefined )
		kk.run( 88, () => { } )
		console.log( kk.getStore(), 9, undefined )
		kk.exit(() => {
			console.log( kk.getStore(), 10, undefined );
			kk.run( 43, () => { } )
			console.log( kk.getStore(), 11, undefined );
		})
		console.log( kk.getStore(), 12, undefined );
	})
	console.log( kk.getStore(), 13, 12 );
})
console.log( kk.getStore(), 16, undefined );
})

console.log(kk.getStore(), 999, undefined);
