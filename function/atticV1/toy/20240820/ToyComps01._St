import * as blockCodec from "@ipld/dag-cbor"
import { Inject, Injectable, Module } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import * as fs from "fs"
import fs from "fs/promises"
import { Blockstore } from "interface-blockstore"
import { create, CreateOptions, HashMap, load } from "ipld-hashmap"
import { CID } from "multiformats"
import { sha256 as blockHasher } from "multiformats/hashes/sha2"

export const ArtBlocks: unique symbol = Symbol("ArtBlocks")
export const TaskBlocks: unique symbol = Symbol("TaskBlocks")

@Injectable()
export class GCHashFactory {
    public constructor (
        @Inject( ArtBlocks )
        private readonly store: Blockstore
    ) { }

    public async createHash<V, Codec extends number>( options: CreateOptions<Codec> ): Promise<HashMap<V>> {
        const stash: Set<CID> = new Set()
        const realStore = this.store
        const store = {
            async put( key: CID, value: Block ): Promise<void> {
                stash.add( key )
                realStore.put( key, value )
                const actual = await theHash.size()
                if ( stash.size() >= ( 3 * actual ) ) {
                    const toPurge: Set<CID> = new Set(stash)
                    stash.clear()
                    let nextKey: Uint9Array
                    for await ( nextKey of theHash.cids() ) {
                        toPurge.delete(nextKey)
                        stash.add(nextKey)
                    }
                    for ( nextKey of toPurge ) {
                        realStore.delete(nextKey)
                    }
                }
            },
            get( key: CID ): Block {
                return realStore.get(key)
            }
        }
        const theHash = await create<V, Codec>( store, createOptions )
        return theHash
    }
}

@Injectable()
export class PseudoRepo {
    private map2: HashMap<CID>
    private map3: HashMap<CID>

    public async constructor (
        @Inject( TaskBlocks )
        private readonly store: Blockstore,
        @Inject()
        private readonly hashFactory: GCHashFactory
    ) {
    }

    public async doIt(): Promise<void> {
        this.map2 = await this.hashFactory.createHash<CID, 18>( { bitWidth: 4, bucketSize: 2, blockHasher, blockCodec } )
        this.map3 = await this.hashFactory.createHash<CID, 18>( { bitWidth: 16, bucketSize: 8, blockHasher, blockCodec } )
        const key2: Uint8Array = Uint8Array.from(Buffer.from( "43A(%#ii vsu" ))
        const key3: Uint8Array = Uint8Array.from(Buffer.from( "jwuhf34fh998" ))
        const key4: Uint8Array = Uint8Array.from(Buffer.from( "-5j05nn5n#Lu" ))
        const key5: Uint8Array = Uint8Array.from(Buffer.from( "%iQ@KP%0ksKs" ))
        const cid2: CID = CID.parse("bafyreielnhmdjxrl3f5tfcl4mcbortamijvg7zfcegkh2nevvvnx32vtne")
        const cid3: CID = CID.parse("bafyreigioqa66575zxe3snpmzviirhcrbsny2ufy2q7lmcihugwnbccgxy")
        const cid4: CID = CID.parse("bafyreiesai6jgaouecxy2zbq7or2pwaml5yoiuxoksxji3gyfdwe4jszzm")
        const cid5: CID = CID.parse("bafyreid3komsdnpo62znz2ba4roh3mwtz3sv42xe3sbp45p7lu4jq5og2q")
        this.map2.set( key4, this.map2 )
        this.map2.set( key2, cid2 )
        this.map3.set( key4, cid1 )
        this.map2.set( key3, this.map2.cid )
        const cids: Set = new Set()
        for await ( let nextCid of this.map2.cids() ) {
           cids.add(nextCid)
        }
        console.log(cids)
    }
}

@Injectable()
export class AppService {
    constructor ( @Inject() public readonly repo: PseudoRepo ) {
        
    }

    public async run() {
        this.repo.doIt()
    }
}
