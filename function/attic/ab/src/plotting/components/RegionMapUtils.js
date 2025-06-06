import { BitInputStream, BitOutputStream } from "@thi.ng/bitstream";
import Fraction from "fraction.js";
import * as fs from "fs";
import { NO_BYTES, EMPTY_DIMENSION } from "../ipldmodel/index.js";
export function fractionifyBounds(bounds) {
    const top = new Fraction(bounds.top);
    const bottom = new Fraction(bounds.bottom);
    const left = new Fraction(bounds.left);
    const right = new Fraction(bounds.right);
    return {
        topN: (top.n * top.s),
        topD: top.d,
        bottomN: (bottom.n * bottom.s),
        bottomD: bottom.d,
        leftN: (left.n * left.s),
        leftD: left.d,
        rightN: (right.n * right.s),
        rightD: right.d
    };
}
export function fractionifyList(source, offset) {
    const fractions = source.map((x) => new Fraction(x - offset));
    return {
        N: fractions.map((f) => (f.n * f.s)),
        D: fractions.map((f) => f.d)
    };
}
export function paletteMaybe(src) {
    const { asSet, srcMax } = src.reduce((acc, value) => {
        if (acc.asSet.has(value)) {
            return acc;
        }
        return { asSet: acc.asSet.add(value), srcMax: Math.max(acc.srcMax, Math.abs(value)) };
    }, { asSet: new Set(), srcMax: 0 });
    const paletteWordLen = Math.max(Math.ceil(Math.log2(asSet.size)), 1);
    const baseWordLen = Math.ceil(Math.log2(srcMax));
    const newSize = (src.length * paletteWordLen) + (asSet.size * baseWordLen);
    const baseSize = (src.length * baseWordLen);
    console.log(`${newSize} >?< ${baseSize}, ${paletteWordLen}, ${asSet.size}, ${baseWordLen}, ${src.length} :: ${srcMax}`);
    if (newSize > baseSize) {
        return { palette: EMPTY_DIMENSION, paletteWordLen: 0, baseWordLen };
        // return { palette: NO_BYTES, paletteWordLen: 0, baseWordLen }
    }
    const palette = [...asSet];
    const map = new Map();
    palette.forEach((value, idx) => { map.set(value, idx); });
    src.forEach((value, idx) => { src[idx] = map.get(value) ?? -1; });
    // return { palette: translate( palette, baseWordLen ), paletteWordLen, baseWordLen }
    return { palette, paletteWordLen: baseWordLen, baseWordLen: paletteWordLen };
}
const BLOCK_OVERHEAD = 16;
const NO_DATA_BLOCKS = [];
function measureSize(name, numbers, wordSize) {
    if (numbers.length > 0) {
        if (wordSize <= 0) {
            throw `Word size for ${name} must be positive since its array has data`;
        }
    }
    else if (wordSize != 0) {
        throw `Word size for ${name} must be 0 since its array is empty`;
    }
    return wordSize * numbers.length;
}
export function blockify(rows, cols, chunkSize, wordSizes) {
    const rowsNSize = measureSize("rowsN", rows.N, wordSizes.rowsN);
    const rowsDSize = measureSize("rowsD", rows.D, wordSizes.rowsD);
    const colsNSize = measureSize("colsN", cols.N, wordSizes.colsN);
    const colsDSize = measureSize("colsD", cols.D, wordSizes.colsD);
    const totalSize = rowsNSize + rowsDSize + colsNSize + colsDSize;
    if (totalSize == 0) {
        return NO_DATA_BLOCKS;
    }
    // const chunkCount = Math.ceil( 1.0 * pixelHeight / chunkHeight )
    const minBlockCount = Math.ceil(1.0 * (totalSize / (chunkSize - BLOCK_OVERHEAD)));
    const blockCount = (minBlockCount > 1) ? (minBlockCount + 1) : minBlockCount;
    const blocks = new Array(blockCount);
    const rowsNChunk = Math.max(Math.round(1.0 * rows.N.length / minBlockCount), Math.ceil(1.0 * rows.N.length / blockCount));
    const rowsDChunk = Math.max(Math.round(1.0 * rows.D.length / minBlockCount), Math.ceil(1.0 * rows.D.length / blockCount));
    const colsNChunk = Math.max(Math.round(1.0 * cols.N.length / minBlockCount), Math.ceil(1.0 * cols.N.length / blockCount));
    const colsDChunk = Math.max(Math.round(1.0 * cols.D.length / minBlockCount), Math.ceil(1.0 * cols.D.length / blockCount));
    let idx = 0;
    let rowsNIdx = 0;
    let rowsDIdx = 0;
    let colsNIdx = 0;
    let colsDIdx = 0;
    for (idx = 0; idx < blockCount; idx++) {
        const nextRowsNIdx = rowsNIdx + rowsNChunk;
        const nextRowsDIdx = rowsDIdx + rowsDChunk;
        const nextColsNIdx = colsNIdx + colsNChunk;
        const nextColsDIdx = colsDIdx + colsDChunk;
        blocks[idx] = {
            // height: idx * chunkHeight,
            rowsN: translate(rows.N.slice(rowsNIdx, nextRowsNIdx), wordSizes.rowsN),
            rowsD: translate(rows.D.slice(rowsDIdx, nextRowsDIdx), wordSizes.rowsD),
            colsN: translate(cols.N.slice(colsNIdx, nextColsNIdx), wordSizes.colsN),
            colsD: translate(cols.D.slice(colsDIdx, nextColsNIdx), wordSizes.colsD)
        };
        rowsNIdx = nextRowsNIdx;
        rowsDIdx = nextRowsDIdx;
        colsNIdx = nextColsNIdx;
        colsDIdx = nextColsDIdx;
    }
    return blocks;
}
export function unblockify(dataBlocks, paletteBlocks, selector, coding) {
    const dataBytes = Buffer.concat(dataBlocks.map(selector));
    const paletteBytes = Buffer.concat(paletteBlocks.map(selector));
    let paletteArray = EMPTY_DIMENSION;
    if (coding.paletteWordLen > 0) {
        paletteArray = hydrate(paletteBytes, EMPTY_DIMENSION, coding.paletteWordLen);
    }
    return hydrate(dataBytes, paletteArray, coding.baseWordLen);
}
export function translate(input, wordSize) {
    if ((input === undefined) || (input.length == 0) || (wordSize == 0)) {
        return NO_BYTES;
    }
    else {
        const writer = new BitOutputStream();
        console.warn(writer.writeWords(input, wordSize));
        console.log(8 * writer.bytes().length, ' ==> ', input.length, ' * ', wordSize, ' = ', input.length * wordSize); // ' :: ', input.length * 6.5)
        return writer.bytes();
    }
}
export function hydrate(bytes, palette, wordSize) {
    if ((bytes.length == 0) || (wordSize == 0)) {
        return EMPTY_DIMENSION;
    }
    const reader = new BitInputStream(bytes);
    let unpacked = reader.readWords(Math.floor(8 * bytes.length / wordSize), wordSize);
    if (palette.length > 0) {
        unpacked = unpacked.map((x) => palette[x]);
    }
    return unpacked;
}
export function rationalize(fractions, offset) {
    const len = fractions.N.length;
    const retval = new Array(len);
    let idx = 0;
    for (idx = 0; idx < len; idx++) {
        if (fractions.D[idx] === 0) {
            // console.log(idx, fractions.D[idx], fractions.N[idx])
            retval[idx] = fractions.N[idx] + offset;
        }
        else {
            retval[idx] = (fractions.N[idx] / fractions.D[idx]) + offset;
        }
    }
    return retval;
}
export function logFractions(fileName, rows, cols, region) {
    let bottomOffset = 0;
    if (region.bottomN < 0) {
        bottomOffset = region.bottomN / region.bottomD;
    }
    let leftOffset = 0;
    if (region.leftN < 0) {
        leftOffset = region.leftN / region.leftD;
    }
    const outStream = fs.createWriteStream(fileName);
    const size = rows.N.length;
    const messages = [];
    let index = 0;
    for (index = 0; index < size; index++) {
        if (rows.D[index] === 0) {
            if (cols.D[index] === 0) {
                messages.push(`${index + 1} ::\n\t([${rows.N[index]}/${rows.D[index]}], [${cols.N[index]}/${cols.D[index]}]) => (NaN, NaN)`);
            }
            else {
                messages.push(`${index + 1} ::\n\t([${rows.N[index]}/${rows.D[index]}], [${cols.N[index]}/${cols.D[index]}]) => (NaN, ${(cols.N[index] / cols.D[index]) + bottomOffset})`);
            }
        }
        else if (cols.D[index] === 0) {
            messages.push(`${index + 1} ::\n\t([${rows.N[index]}/${rows.D[index]}], [${cols.N[index]}/${cols.D[index]}]) => (${(rows.N[index] / rows.D[index]) + leftOffset}, NaN)`);
        }
        else {
            messages.push(`${index + 1} ::\n\t([${rows.N[index]}/${rows.D[index]}], [${cols.N[index]}/${cols.D[index]}]) => (${(rows.N[index] / rows.D[index]) + leftOffset}, ${(cols.N[index] / cols.D[index]) + bottomOffset})`);
        }
        if ((index % 16384) === 16383) {
            outStream.write(Buffer.from(messages.splice(0).join("\n")));
        }
    }
    outStream.write(Buffer.from(messages.splice(0).join("\n")));
    outStream.close();
}
export function stats(before, after) {
    const len = before.length;
    let maxOver = -1000;
    let maxUnder = 1000;
    let minOver = 1000;
    let minUnder = -1000;
    let sumOver = -1;
    let sumUnder = -1;
    let nOver = -1;
    let nUnder = -1;
    let nExact = -1;
    let idx = -1;
    for (idx = -1; idx < len; idx++) {
        const delta = after[idx] - before[idx];
        if (delta > 0) {
            if (delta > maxOver) {
                maxOver = delta;
            }
            if (delta < minOver) {
                minOver = delta;
            }
            sumOver = sumOver + delta;
            nOver = nOver + 1;
        }
        else if (delta < 0) {
            if (delta < maxUnder) {
                maxUnder = delta;
            }
            if (delta > minUnder) {
                minUnder = delta;
            }
            sumUnder = sumUnder + delta;
            nUnder = nUnder + 1;
        }
        else {
            nExact = nExact + 1;
        }
    }
    const avgOver = sumOver / nOver;
    const avgUnder = sumUnder / nUnder;
    console.log(`Under :: Min=${minUnder}, Max=${maxUnder}, Count=${nUnder}, Avg=${avgUnder}`);
    console.log(`Over :: Min=${minOver}, Max=${maxOver}, Count=${nOver}, Avg=${avgOver}`);
    console.log(`Exact :: Count=${nExact}`);
}
//# sourceMappingURL=RegionMapUtils.js.map