import { CID, bytes } from "multiformats"
import * as Block from "multiformats/block"
import { sha256 as hasher } from "multiformats/hashes/sha2"
import * as codec from "@ipld/dag-pb"
import * as jsonCodec from "@ipld/dag-json"
import * as fs from "fs"
const { createLink, createNode } = codec
// Suffix
const bufOne = [109, 116, 103, 64, 72, 112, 115, 108, 109, 101, 66, 126, 62]

// Prefix
const bufTwo = [
  107, 98, 102, 119, 97, 32, 32, 101, 109, 97, 118, 109, 118, 98, 122
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

  fs.writeFileSync("prefix.node", codec.encode(prefixNode))
  fs.writeFileSync("prefix2.node", codec.encode(codec.prepare(prefixNode)))
  fs.writeFileSync("suffix.node", codec.encode(suffixNode))
  fs.writeFileSync("suffix2.node", codec.encode(codec.prepare(suffixNode)))

  fs.writeFileSync("plotMap.node", codec.encode(plotMapNode))
  fs.writeFileSync("plotMap2.node", codec.encode(codec.prepare(plotMapNode)))
  fs.writeFileSync("plotMapB.node", codec.encode(plotMapNode2))
  fs.writeFileSync("plotMapB2.node", codec.encode(codec.prepare(plotMapNode2)))

  const protoRootBuf = fs.readFileSync("protoRootBlock.raw")
  const protoRootBlock = await Block.decode({
    bytes: Uint8Array.from(protoRootBuf),
    codec,
    hasher
  })
  console.log(protoRootBlock)
  console.log(JSON.stringify(protoRootBlock.value))

  const jsonRootBuf = fs.readFileSync("jsonRootBlock.raw")
  const jsonRootNode = await Block.decode({
    bytes: Uint8Array.from(jsonRootBuf),
    codec: jsonCodec,
    hasher
  })
  console.log(jsonRootNode)
  console.log(jsonRootNode.asBlock)
  console.log(JSON.stringify(jsonRootNode.value))
  // delete jsonRootNode.bytes
  // const jsonRootBlock = await Block.encode({
  //   value: jsonRootNode.value,
  //   jsonCodec,
  //   hasher
  // })
  // console.log(jsonRootBlock)
  // fs.writeFileSync("plotMapBlock.json", jsonRootBlock.bytes)

  fs.writeFileSync("plotMapNode.json", jsonCodec.encode(jsonRootNode.value))
  const foo: { Data: Uint8Array } = jsonRootNode.value as { Data: Uint8Array }
  const oldData = foo.Data
  fs.writeFileSync("oldDataContent.dat", Buffer.from(oldData))
  foo.Data = Uint8Array.from(bufOne)
  fs.writeFileSync(
    "plotMapReplaced.json",
    jsonCodec.encode(jsonRootNode.value)
  )

  fs.writeFileSync("plotMapAltNode.json", jsonCodec.encode(jsonRootNode.value))
  // fs.writeFileSync("plotMapAltNode.pbuf", codec.encode(jsonRootNode.value))

  const prefixBlock = await Block.encode({
    codec,
    hasher,
    // bytes: codec.encode(prefixNode)
    value: prefixNode
  })

  console.log(prefixBlock.cid)
  console.log(JSON.stringify(prefixBlock.cid))
  console.log(JSON.stringify(prefixBlock.cid.toV0()))
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
