export interface IChanMonitor<Msg> {
   request: (msg: Msg) => Promise<Msg>
   cancel: (msg: Msg) => void
}
