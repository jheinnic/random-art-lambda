import { AsyncLocalStorage } from "async_hooks"

const kk = new AsyncLocalStorage();
let foo = () => {
	console.log(0);
}

kk.run( 12, () => {
	console.log( kk.getStore(), 1 );
	kk.run( 21, () => {
		console.log(kk.getStore(), 2)
		setTimeout( () => {
			console.log(kk.getStore(), 14)
		}, 400);
	});
	console.log( kk.getStore(), 3 );
	kk.exit(() => {
		console.log( kk.getStore(), 4 );
		setTimeout( () => {
			console.log(kk.getStore(), 15)
		}, 400);
		kk.run( 51, () => {
			console.log(kk.getStore(), 5)
			setTimeout( () => {
				console.log(kk.getStore(), 16)
			}, 400);
			console.log(kk.getStore(), 17)
			setTimeout( () => {
				foo = AsyncLocalStorage.bind( () => {
					console.log(kk.getStore(), 999);
				})
				console.log("Binny1")
				foo();
				console.log("Binny2")
				kk.exit(foo);
				console.log("Binny3")
				foo();
				kk.exit( () => {
					console.log(kk.getStore(), 21);
					console.log("Binny4")
					foo();
					kk.run( 102, () => {
						console.log("Binny4-B")
						foo();
				 		console.log(kk.getStore(), 22);
					})
					console.log(kk.getStore(), 23);
					console.log("Binny4-C")
					foo();
					kk.run( 101, () => {
						console.log("Binny10");
						foo()
						console.log( kk.getStore(), 101);
						foo = AsyncLocalStorage.bind( () => {
							console.log(kk.getStore(), 888);
						})
						console.log("Binny10-B");
						foo()
					})
					console.log("Binny5")
					foo()
					console.log(kk.getStore(), 24);
					setTimeout( () => {
						console.log("Binny7");
						foo()
						kk.run( 33, () => {
							// kk.exit(() => {
								foo = AsyncLocalStorage.bind( () => {
									kk.exit( () => {
										// Negates exit!
										kk.run( 75, () => {
											console.log(kk.getStore(), 101);
										})
										foo = AsyncLocalStorage.bind( () => {
											console.log(kk.getStore(), 555);
										})
									})
									console.log(kk.getStore(), "Binny8");
									foo()
									kk.run( 74, () => {
										console.log(kk.getStore(), 100);
									})
									console.log(kk.getStore(), "Binny9");
									foo()
									console.log(kk.getStore(), 777);
								})
							//})
						})
					}, 350)
				})
				console.log("Binny6")
				foo();
			}, 200);
		});
		setTimeout( () => {
			console.log(kk.getStore(), 18)
		}, 400);
		console.log( kk.getStore(), 19);
	});
	console.log( kk.getStore(), 6);
	kk.enterWith(19);
	console.log( kk.getStore(), 7 );
	setTimeout( () => {
		console.log(kk.getStore(), 9)
		foo();
	}, 100);
	setTimeout( () => {
		console.log(kk.getStore(), 10)
		foo();
	}, 1000);
	kk.enterWith(35);
	console.log( kk.getStore(), 8 );
	kk.run(17 , () => {
		console.log(kk.getStore(), 11)
		setTimeout( () => {
			console.log(kk.getStore(), 12)
		}, 400);
	});
	console.log( kk.getStore(), 13);
	foo();
});
console.log(kk.getStore(), 20);
foo();
