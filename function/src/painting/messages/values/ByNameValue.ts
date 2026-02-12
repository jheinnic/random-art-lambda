export type ByNameValue<PropName extends string> = {
   [P in PropName as `${P}`]: string
}
function makeIt<P extends string>(key: P, value: string): ByNameValue<P> {
   // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
   return {
      [key]: value,
   } as ByNameValue<P>
}
