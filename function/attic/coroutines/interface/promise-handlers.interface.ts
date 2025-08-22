export interface IPromiseHandlers<Msg> {
   resolve: (msg: Msg) => void
   reject: (err: any) => void
}
