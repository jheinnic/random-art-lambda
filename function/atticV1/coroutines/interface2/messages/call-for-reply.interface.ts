export interface CallForReply<R extends []> {
   resolve: (...value: R) => void;
   reject: (err: any) => void;
}
