import { MemoryBlockstore } from "blockstore-core"
import { importer, UserImporterOptions } from "ipfs-unixfs-importer"
import { ImportCandidate } from "ipfs-unixfs-importer/types/src/types"
import * as fs from "fs"
import { ReadStream } from "fs"

async function main () {
  // await trialOne();
  await trialTwo()
}

export interface Input {
  path: string
  content: ReadStream
}

function refresh (sourceArray: Input[]) {
  return sourceArray.map((source) => {
    if (!source.path) {
      // Cannot re-open a source File if we have not retained its path
      return source
    }
    let path: string = source.path
    if (!path.startsWith("/tmp")) {
      if (path.startsWith("tmp")) {
        path = "/" + path
        source.path = path
      }
    }

    try {
      source.content = fs.createReadStream(source.path)
    } catch (err) {
      console.trace()
    }
    return source
  })
}

function cleanup (sourceArray: Input[]) {
  for (const source of sourceArray) {
    source.content.close()
  }
}

// Where the blocks will be stored
const file1 = "/tmp/foo/bar"
const file2 = "/tmp/foo/quxx"

// Import path /tmp/foo/bar
const source1 = [{
  path: file1,
  content: fs.createReadStream(file1)
}]
const source2 = [{
  path: file2,
  content: fs.createReadStream(file2)
}]

const source3 = [...source1, ...source2]
const source4 = [...source2, ...source1]

const testOne = [source1, source2, source3, source4]
const testTwo = {
  12: [source1, source2],
  13: [source1, source3],
  14: [source1, source4],
  21: [source2, source1],
  24: [source2, source4],
  23: [source2, source3],
  123: [source1, source2, source3],
  124: [source1, source2, source4],
  213: [source2, source1, source3],
  214: [source2, source1, source4]
}

const options: UserImporterOptions = {
  strategy: "balanced",
  reduceSingleLeafToSelf: false,
  rawLeaves: true,
  leafType: "raw"
}

async function trialOne () {
  // Where the blocks will be stored
  const blockstore = new MemoryBlockstore()

  for await (const entry of importer(source1, blockstore, options)) {
    console.info(entry)
  }
}

async function trialTwo () {
  for (let source of testOne) {
    console.warn("Begin new import!  " + source)
    const blockstore = new MemoryBlockstore()
    source = refresh(source)
    for await (const entry of importer(source, blockstore, options)) {
      console.info(entry)
    }
    cleanup(source)
  }

  for (const inputPair of Object.entries(testTwo)) {
    const key: string = inputPair[0]
    const sources = inputPair[1]
    console.warn("\nBegin new multi-step import!  " + key)
    const blockstore = new MemoryBlockstore()
    for (let source of sources) {
      console.warn("Begin nested import step")
      source = refresh(source)
      for await (const entry of importer(source, blockstore, options)) {
        console.info(entry)
      }
      cleanup(source)
    }
  }
}

main().then(
  () => {
    console.log("Main returned through success state!")
  }
).catch(
  (err) => {
    console.error(`main() returned in error state: ${err.stack}`, err)
    console.trace()
  }
)
