import { Nominal } from "../../../messages/interface/Nominal.js"
import { PlotMapGeometry } from "./PlotMapGeometry.js"
import { RawPixelData } from "./RawPixelData.js"
import { RawPngBuffer } from "./RawPngBuffer.js"

const Prefix: unique symbol = Symbol("Prefix")
const Suffix: unique symbol = Symbol("Suffix")
const Pixels: unique symbol = Symbol("Pixels")
const Painted: unique symbol = Symbol("Painted")
const PaintGeometryName: unique symbol = Symbol("Paint Geometry Name")

export type PrefixString = Nominal<string, typeof Prefix>
export type SuffixString = Nominal<string, typeof Suffix>
export type AnyAffixString = PrefixString & SuffixString

export type PrefixData = Nominal<Uint8ClampedArray, typeof Prefix>
export type SuffixData = Nominal<Uint8ClampedArray, typeof Suffix>
export type AnyAffixData = PrefixData & SuffixData

export type SizedPixelsString = Nominal<string, typeof Pixels>
export type ValidPixelData = Nominal<RawPixelData, typeof Pixels>

export type SizedPngString = Nominal<string, typeof Painted>
export type ValidPngData = Nominal<RawPngBuffer, typeof Painted>

/**
 * Marker type asserting that the pixel height to width ratio is proportional to the
 * ratio between the difference between the upper and lower value boundaries to the
 * difference between the right and left value boundaries.
 */
export type ValidPaintGeometry = Nominal<
   PlotMapGeometry,
   typeof PaintGeometryName
>
