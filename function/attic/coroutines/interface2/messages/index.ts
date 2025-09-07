// TODO: Delete these comments.  Ignore them until then...
//
// These message types are part of an experimental work involving data pipelines
// created with CSP-style channels.  It is not yet ready for use, so none of this
// is exported through the root module yet!
//
// The intent is to provide a facility for adapting a function from P extends any[]
// to R extends any[]:
//
// (...input: P) => R
//
// ...such that a calling consumer can provide both the arguments for P and a
// post-processing step for R:
//
// (...input: R) => S
//
// The objective is to facilitate the construction of a transducer that supports
// the contract Chan<P, R''>, given two input arrays of functions.  The first
// array is a series of third party functions the developer wants to utilize in
// series, the second is the series of interleaving operations required to transform
// the output of one stage to the input of the next.
//
// [ (...args: P) => R, (...args: P') => R', (...args: P'') => R'']
// [ (...args: R) => P', (...args: R') => P'']
//
// ...Or with the inclusion of a context object...: Chan<C, Promise<[C, R'']>>
//
// [ (...args: P) => R, (...args: P') => R', (...args: P'') => R'']
// [ (ctx: C) => P, (ctx: C, ...args: R) => P', (ctx: C, ...args: R') => P'']

// export * from './call-for-reply.interface';
export * from './message-for-ack.interface';
export * from './message-for-reply.interface';
export * from './message-with-callback.type';
