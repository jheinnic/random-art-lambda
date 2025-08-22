import { CID } from 'multiformats/cid'
import { sha256 } from 'multiformats/hashes/sha2'
import { prepare, decode, encode } from '@ipld/dag-pb'
import * as dagPB from '@ipld/dag-pb'
import { UnixFS } from 'ipfs-unixfs'


async function run() {
    // const bytes = dagPB.encode({
    //   Data: new TextEncoder().encode('Some data as a string'),
    //   Links: []
    // })

    // also possible if you `import dagPB, { prepare } from '@ipld/dag-pb'`
    // const bytes = dagPB.encode(prepare('Some data as a string'))
    const encoder = new TextEncoder()
    const decoder = new TextDecoder();

    const bytes = dagPB.encode(
        prepare(
            encoder.encode('Lamentations')
	)
    );
    // const bytes2 = encoder.encode('Lamentations');
    const hexBytes = Buffer.from(bytes).toString('hex');

    const hash = await sha256.digest(bytes)
    const cid = CID.create(1, dagPB.code, hash)

    console.log(cid, '=>', hexBytes);
    console.log(cid.toV0(), '=>', hexBytes);
    console.log(cid.toV0().toV1(), '=>', hexBytes);
    console.log(cid.toV0().toV1().toV0(), '=>', hexBytes);
    console.log(cid.toJSON(), '=>', hexBytes);
    console.log(cid.toString(), '=>', hexBytes);

    const decoded = dagPB.decode(bytes);
    console.log(decoded)

    const message = decoder.decode(
	decoded.Data
    );
    console.log(`decoded "Data": ${message}`)

    const file = new UnixFS()
}

run().catch((err) => {
    console.error(err)
    process.exit(1)
})
