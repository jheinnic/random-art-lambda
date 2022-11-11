import * as codec from "@ipld/dag-pb"
import * as fs from "fs"
import { bytes, CID } from "multiformats"
import * as Block from "multiformats/block"
import { sha256 as hasher } from "multiformats/hashes/sha2"

const { createLink, createNode } = codec
// Suffix
const bufOne = [
  8, 2, 18, 13, 109, 116, 103, 64, 72, 112, 115, 108, 109, 101, 66, 126, 62, 24,
  13
]

// Prefix
const bufTwo = [
  8, 2, 18, 15, 107, 98, 102, 119, 97, 32, 32, 101, 109, 97, 118, 109, 118, 98,
  122, 24, 15
]

// PlotMap
const proto = fs.readFileSync(
  "/home/ionadmin/Git/lambdas/random-art-lambda/function/fdoc.proto"
)
const proto2 = fs.readFileSync(
  "/home/ionadmin/Git/lambdas/random-art-lambda/function/gdoc.proto"
)

async function run2 (): Promise<void> {
  const prefixNode = createNode(Uint8Array.from(bufOne), [])
  const suffixNode = createNode(Uint8Array.from(bufTwo), [])
  const plotMapNode = createNode(Uint8Array.from(proto), [])
  const plotMapNode2 = createNode(Uint8Array.from(proto2), [])

  console.log(JSON.stringify(prefixNode))

  const prefixBlock = await Block.encode({
    codec,
    hasher,
    // bytes: codec.encode(prefixNode)
    value: prefixNode
  })
  const suffixBlock = await Block.encode({
    codec,
    hasher,
    value: suffixNode
  })
  const plotMapBlock = await Block.encode({
    codec,
    hasher,
    value: plotMapNode
  })
  const plotMapBlock2 = await Block.encode({
    codec,
    hasher,
    value: plotMapNode2
  })

  const prefixCid = prefixBlock.cid.toV0()
  const suffixCid = suffixBlock.cid.toV0()
  const plotMapCid = plotMapBlock.cid.toV0()
  const plotMap2Cid = plotMapBlock2.cid.toV0()

  const prefixLink = createLink("prefix", 0, prefixCid)

  console.log(`PrefixCID: ${prefixCid.toString()}`)
  console.log(`SuffixCID: ${suffixCid.toString()}`)
  console.log(`PlotMapCID: ${plotMapCid.toString()}`)
  console.log(`PlotMap2CID: ${plotMap2Cid.toString()}`)

  const bufOneSpec: ItemSpec = [bufOne.length, prefixCid]
  const bufTwoSpec: ItemSpec = [bufTwo.length, suffixCid]
  const plotMapOneSpec: ItemSpec = [proto.length, plotMapCid]
  const plotMapTwoSpec: ItemSpec = [proto2.length, plotMap2Cid]

  let params: [ItemSpec, ItemSpec, ItemSpec]
  const allParams: Array<[ItemSpec, ItemSpec, ItemSpec]> = [
    [bufOneSpec, bufTwoSpec, plotMapOneSpec],
    [bufTwoSpec, bufOneSpec, plotMapOneSpec],
    [bufOneSpec, bufTwoSpec, plotMapTwoSpec],
    [bufTwoSpec, bufOneSpec, plotMapTwoSpec]
  ]
  for (params of allParams) {
    const artworkCid = await nameSpec(...params)
    console.log(`Artwork CID: ${artworkCid.toString()}`)
  }
}

export type ItemSpec = [length: number, cid: CID]

const EMPTY_CONTENT = Uint8Array.of()
async function nameSpec (
  prefixSpec: ItemSpec,
  suffixSpec: ItemSpec,
  plotMapSpec: ItemSpec,
  content: Uint8Array = EMPTY_CONTENT
): Promise<CID> {
  const prefixLink = createLink("prefix", ...prefixSpec)
  const suffixLink = createLink("suffix", ...suffixSpec)
  const plotMapLink = createLink("plotMap", ...plotMapSpec)

  const artSpecNode = createNode(Uint8Array.of(), [
    prefixLink,
    suffixLink,
    plotMapLink
  ])
  const artSpecBlock = await Block.encode({
    codec,
    hasher,
    value: artSpecNode
  })
  return artSpecBlock.cid.toV0()
}

async function run (): Promise<void> {
  const cid1 = CID.parse("QmWDtUQj38YLW8v3q4A6LwPn4vYKEbuKWpgSm6bjKW6Xfe")
  const cid2 = CID.parse(
    "bafyreifepiu23okq5zuyvyhsoiazv2icw2van3s7ko6d3ixl5jx2yj2yhu"
  )

  const links = [
    createLink("link1", 100, cid1),
    createLink("link2", 200, cid2)
  ]
  const value = createNode(Uint8Array.from([0, 1, 2, 3, 4]), links)
  console.log(value)

  const block = await Block.encode({ value, codec, hasher })
  console.log(block.cid)
  console.log(
    `Encoded: ${bytes.toHex(block.bytes).replace(/(.{80})/g, "$1\n         ")}`
  )
}

run2().catch((err) => console.error(err))
