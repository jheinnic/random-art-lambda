export type SyncFunc<Params extends any[] = any[], Output = any> =
   Output extends Promise<any> ? never : (...input: Params) => Output

export type AnySyncFunc<Output = any> =
   Output extends Promise<any> ? never : (...input: any[]) => Output

export type NoArgsSyncFunc<Output = any> =
   Output extends Promise<any> ? never : () => Output
