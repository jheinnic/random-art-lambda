const HANDLER_REGISTRY: {
   [name: string]: { transform: (it: any) => any }
} = {}

HANDLER_REGISTRY.Uint32Array = {
   transform: function (tim: Uint32Array) {
      const oker: ArrayBufferLike = tim.buffer
      const buf: Buffer<ArrayBufferLike> = Buffer.from(oker)
      return buf.toString("base64")
   },
}
HANDLER_REGISTRY.Alt = {
   transform: function (tim: any) {
      return tim
   },
}

function findRuleForObject(target: {
   name: string
}): undefined | keyof typeof HANDLER_REGISTRY {
   if (target instanceof Uint32Array) {
      return "Uint32Array"
   }
   return undefined
}

// Conceptual Proxy Logic for Serialization
const proxyHandler = {
   // Trap the .toJSON() method call
   get(target: any, prop: string, receiver: unknown) {
      if (prop === "toJSON") {
         return function () {
            // 1. Compile-Time Dispatch (Informed by T's type):
            const ruleName = findRuleForObject(target) // Logic derived from RuleNameIfMappedBy

            // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
            if (ruleName) {
               // 2. Handler Dispatch (Prune the graph):
               const handler = HANDLER_REGISTRY[ruleName]
               const pojo = handler.transform(target)

               // 3. Store Deserialization Metadata:
               pojo[".wra.net.rule"] = ruleName

               // This POJO is returned to JSON.stringify, terminating traversal here.
               return pojo
            }

            // If no handler, delegate to default traversal (built-in serialization)
            return target
         }
      }

      // Default behavior for other properties
      return Reflect.get(target, prop, receiver)
   },
}

// Use: new Proxy(myObject, proxyHandler)

const myObject = {
   name: "Fred",
   data: new Uint32Array(16),
   color: "blue",
   children: [
      { name: "Anne", age: 14, data: new Uint32Array(8) },
      { name: "Tim", age: 3, data: new Uint32Array(4) },
   ],
}

const proxies = [
   new Proxy(myObject, proxyHandler),
   new Proxy(myObject.children[0], proxyHandler),
   new Proxy(myObject.children[1], proxyHandler),
]

console.log(JSON.stringify(myObject))
console.log(" --== *** ==--")
console.log(JSON.stringify(proxies[0]))
console.log(" --== *** ==--")
console.log(JSON.stringify(proxies[1]))
console.log(" --== *** ==--")
console.log(JSON.stringify(proxies[2]))
myObject.children = [proxies[1], proxies[2]]
console.log(" --== *** ==--")
console.log(JSON.stringify(proxies[0]))

export function genHex(length: number): string {
   const fill = new Array(length)
   let ii
   // eslint-disable-next-line @typescript-eslint/no-for-in-array
   for (ii in fill) {
      fill[ii] = getChar()
      console.log(ii, " = ", fill[ii])
   }
   const retVal = fill.join("")
   console.log(retVal)
   console.log(retVal.length)
   console.log(fill.length)
   return retVal
}

const RANGE = [
   "0",
   "1",
   "2",
   "3",
   "4",
   "5",
   "6",
   "7",
   "8",
   "9",
   "a",
   "b",
   "c",
   "d",
   "e",
   "f",
]
function getChar(): any {
   return RANGE[Math.ceil(Math.random() * 16)]
}
