export interface MessageForReply<
   P extends any[] = unknown[],
   R extends any[] = unknown[],
> {
   readonly args: P
   readonly resolveHasParam: true
   readonly resolve: (...value: R) => void
   readonly reject: (err: any) => void
}

// export type MessageForReply<P extends any[], R> =
// LengthOf<P> extends 0 ? {
//       resolve: R extends void ? () => void : (value: R) => void;
//       reject: (err: any) => void;
//    } :
//    LengthOf<P> extends 1 ?
//       {
//          args: P[0];
//          resolve: R extends void ? () => void : (value: R) => void;
//          reject: (err: any) => void;
//       } : {
//          args: P;
//          resolve: R extends void ? () => void : (value: R) => void;
//          reject: (err: any) => void;
//       }
