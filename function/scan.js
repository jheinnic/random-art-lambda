let calloc = Buffer.allocUnsafe(1536);
let last = calloc.buffer;
console.log(Buffer.from(last).toString("hex"));
let count = 0;
const limit = 1024;

while( count < limit ) {
    while(last === calloc.buffer) {
        calloc = Buffer.allocUnsafe(1536);
    }
    last = calloc.buffer;
    console.log(Buffer.from(last).toString("hex"));
    // count = count + 1;
}

