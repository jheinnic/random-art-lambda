export interface IBufferSource {
  get: (source: string) => BufferLike
}
