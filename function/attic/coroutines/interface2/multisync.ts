export type MsyncProc<Params extends any[] = any[]> = (
   ...input: Params
) => void | Promise<void>

export type NoArgsMsyncProc = () => void | Promise<void>

export type MsyncFunc<Params extends any[] = any[], Output = any> =
   Output extends Promise<infer P>
      ? (...input: Params) => P | Output
      : (...input: Params) => Output | Promise<Output>

export type AnyMsyncFunc<Output = any> =
   Output extends Promise<infer P>
      ? (...input: any[]) => P | Output
      : (...input: any[]) => Output | Promise<Output>

export type NoArgsMsyncFunc<Output = any> =
   Output extends Promise<infer P>
      ? () => P | Output
      : () => Output | Promise<Output>

export type MsyncChain<
   Params extends any[] = any[],
   Output extends any[] = any[],
> = (...input: Params) => Output | Promise<Output>

export type AnyMsyncChain<Output extends any[] = any[]> = (
   ...input: any[]
) => Output | Promise<Output>

export type NoArgsMsyncChain<Output extends any[] = any[]> = () =>
   | Output
   | Promise<Output>
