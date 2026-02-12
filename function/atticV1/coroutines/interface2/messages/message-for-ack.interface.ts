export interface MessageForAck<P extends any[]> {
   readonly args: P;
   readonly resolveHasParam: false;
   readonly resolve: () => void;
   readonly reject: (err: any) => void;
}
