export type BufferLike =
  | ReadStream
  | Iterable<Buffer>
  | ASyncIterable<Buffer>
  | Promise<Buffer>
  | Buffer
