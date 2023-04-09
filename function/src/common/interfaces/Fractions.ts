export type Fractions<K extends string> = {
    [P in K as `${P}N` | `${P}D`]: number
}