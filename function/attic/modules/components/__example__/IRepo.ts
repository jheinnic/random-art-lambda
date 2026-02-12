export interface IRepo {
   create: (name: string, value: string) => void
   retrieve: (name: string) => string | undefined
}
