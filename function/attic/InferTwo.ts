function abc<
   T extends object,
   Name extends string,
   R extends Record<keyof T, Name> = Record<keyof T, Name>,
>(_name: Name, _remap: NoInfer<R>): T {
   console.log(_name, " is for ", JSON.stringify(_remap))
   return _remap as unknown as T
}

function def<
   Name extends string,
   R extends Record<keyof Worry, Name> = Record<keyof Worry, Name>,
>(_name: Name, _remap: NoInfer<R>): Worry {
   console.log(_name, " is for ", JSON.stringify(_remap))
   return _remap as unknown as Worry
}

function xyz<
   T extends object,
   Name extends string,
   R extends Record<keyof T, Name> = Record<keyof T, Name>,
>(_name: Name, _fake: T, _remap: NoInfer<R>): T {
   console.log(_name, " is for ", JSON.stringify(_remap))
   return _remap as unknown as T
}

type CheckRecord<
   T extends object,
   Name extends string,
   R extends Record<keyof T, string | number> = Record<keyof T, string>,
> = {
   [K in keyof T]: R[K] extends Name ? Name : never // K extends keyof R
   // : never
}

function mno<T extends object, Name extends string>(
   _name: Name,
   _fake: T,
   _remap: Record<keyof T, Name>,
): T {
   console.log(_name, " is for ", JSON.stringify(_remap))
   return _remap as unknown as T
}

function pdq<
   T extends object,
   Name extends string,
   CR extends CheckRecord<T, Name, CR> = Record<keyof T, Name>,
>(_name: Name, _fake: T, _remap: NoInfer<CR>): T {
   console.log(_name, " is for ", JSON.stringify(_remap))
   return _remap as unknown as T
}

interface Worry {
   a: number
   b: string
}

export const foo: Worry = abc("Bob", { a: "Bob", b: "Bob" })
export const goo: Worry = abc("Bob", { b: "Bob" })
export const zoo: Worry = abc("Bob", { a: "Bob", b: "Bob", c: "Bob" })
export const boo = abc<Worry>("Bob", { a: "Bob", b: "Bob", c: "Bob" })
export const woo: Worry = abc<Worry, "Bob", Record<keyof Worry, "Bob">>("Bob", {
   a: "Bob",
   b: "Bob",
   c: "Bob",
})

export const fao: Worry = def("Bob", { a: "Bob", b: "Bob" })
export const gao: Worry = def("Bob", { b: "Bob" })
export const zao: Worry = def("Bob", { a: "Bob", b: "Bob", c: "Bob" })
export const bao = def("Bob", { a: "Bob", b: "Bob", c: "Bob" })
export const wao: Worry = def("Bob", {
   a: "Bob",
   b: "Bob",
   c: "Bob",
})

export const fbo: Worry = xyz("Bob", foo, { a: "Bob", b: "Bob" })
export const gbo: Worry = xyz("Bob", foo, { b: "Bob" })
export const zbo: Worry = xyz("Bob", foo, { a: "Bob", b: "Bob", c: "Bob" })
export const bbo = xyz("Bob", foo, { a: "Bob", b: "Bob", c: "Bob" })
export const wbo: Worry = xyz("Bob", foo, {
   a: "Bob",
   b: "Bob",
   c: "Bob",
})

export const fco: Worry = pdq("Bob", foo, { a: "Bob", b: "Bob" })
export const gco: Worry = pdq("Bob", foo, { b: "Bob" })
export const zco: Worry = pdq("Bob", foo, {
   d: 3,
   a: "Bob",
   b: "Bob",
   c: "Bob",
})
export const bco = pdq("Bob", foo, { a: "Bob", b: "Bob", c: "Bob" })
export const wco: Worry = pdq("Bob", foo, {
   a: "Bob",
   b: "Bob",
   c: "Bob",
})
