import { Injectable } from '@nestjs/common'
import { readFile } from 'fs/promises'
import { IBufferSource } from '../interface/IBufferSource'

@Injectable()
export class FileTransport implements IBufferSource {
  async get (source: string): Promise<Buffer> {
    return await readFile(source)
  }
}
