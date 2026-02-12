import { Inject, Injectable } from "@nestjs/common"
import { CID } from "multiformats"
import { BaseBlockstore } from "blockstore-core"
import { MY_BLOCK_STORE } from "./TestTypes.js"
import { CIDUtil } from "../../src/painting/utility/CIDUtil.js"
// import { FsBlockstore } from './../../src/ipfs/components/FsBlockstore.js'

const vals1: Uint8Array = Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
const vals2: Uint8Array = Uint8Array.from([
   11, 21, 31, 41, 51, 61, 71, 81, 91, 101,
])
const key1: CID = CIDUtil.parseCID(
   "QmNpkD74ocpUBFztzcAf9KRGXCE7be6C3SDjtSy3dBFDzR",
)
const key2: CID = CIDUtil.parseCID(
   "QmeXewWTbGUnvAPQ5VUcJ2uF3PX1uWbZg1Yjk9EJzQqzXF",
)

@Injectable()
export class TestBed {
   constructor(
      @Inject(MY_BLOCK_STORE)
      private readonly blockStore: BaseBlockstore,
   ) {}

   async initTest(): Promise<string> {
      console.log("Initializing")
      console.log(this.blockStore)
      console.log("Initialized")

      // this.blockStore.open()
      console.log(await this.blockStore.put(key1, vals1))
      console.log(await this.blockStore.get(key1))
      try {
         console.log(await this.blockStore.get(key2))
      } catch {
         await this.blockStore.put(key2, vals2)
         console.log(await this.blockStore.get(key2))
      }
      return "Ok"
   }
}
