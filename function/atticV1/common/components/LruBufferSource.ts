import { Injectable } from '@nestjs/common'
import { Cache } from 'caching-map'
import { CommonIoModuleTypes } from '../di/types'
import { IBufferSource } from '../interface/IBufferSource'

@Injectable()
export class LruSource extends Cache implements IBufferSource {
  constructor (
    @Inject(CommonIoModuleTypes.ISourceReader)
    private readonly sourceReader: IBufferSource
  ) {}

  async get (source: string): Promise<Buffer> {
    const stream: BufferSource = this.sourceReader.read(source)
    const _buf = Array<Buffer>()

    switch (stream) {
      case stream instanceof Promise:
        return stream
      case stream instanceof Buffer:
        return stream
      default:
        for await (const event of stream) {
          _buf.push(event)
        }
        return Buffer.concat(_buf)
    }
  }
}

// return await new Promise<Buffer>((resolve, reject) => {
//   const _buf = Array<Buffer>()
//   stream.on('data', (chunk: Buffer) => _buf.push(chunk))
//   stream.on('end', () => resolve(Buffer.concat(_buf)))
//   stream.on('error', (err: Error) =>
//     reject(
//       RuntimeError(`error converting stream :: ${JSON.stringify(err)}`)
//     )
//   )
// };)
