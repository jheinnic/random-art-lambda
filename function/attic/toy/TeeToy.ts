import { Duplex } from 'node:stream'
import { FileHandle, open } from 'fs/promises'
import { WriteStream } from 'node:fs'

export async function * tee (
  source: AsyncIterable<Buffer>,
  ...forkedWriters: WriteStream[]
) {
  for await (const buf of source) {
    for (const writer of forkedWriters) {
      await writer.write(buf)
    }
    yield buf
  }
}

export async function test () {
  const src = await open('/dev/random')
  const tgt1 = await open('/home/ionadmin/outOne.001', 'w')
  const tgt2 = await open('/home/ionadmin/outTwo.002', 'w')
  const tgt3 = await open('/home/ionadmin/outThree.003', 'w')

  const sut = Duplex.from(
    tee(
      src.createReadStream(),
      tgt1.createWriteStream(),
      tgt2.createWriteStream()
    )
  ) // , src, tgt1, tgt2);
  return sut.pipe(tgt3.createWriteStream())
}

export class Foo {
  private readonly forkedWriters: WriteStream[]
  constructor (
    private readonly source: AsyncIterable<Buffer>,
    ...forkedWriters: WriteStream[]
  ) {
    this.forkedWriters = forkedWriters
  }

  async * [Symbol.asyncIterator] () {
    for await (const buf of this.source) {
      for (const writer of this.forkedWriters) {
        await writer.write(buf)
      }
      yield buf
    }
  }
}

export async function testTwo () {
  const src = await open('/dev/urandom')
  const tgt1 = await open('/home/ionadmin/outFour.004', 'w')

  const sut = Duplex.from(
    new Foo(src.createReadStream(), tgt1.createWriteStream())
  ) // , src, tgt1, tgt2);
  return sut
}
