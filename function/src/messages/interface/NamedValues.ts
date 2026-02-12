import { PaintResolution } from "../../painting/messages/values/PaintResolution.js"
import { PlotMapGeometry } from "../../painting/messages/values/PlotMapGeometry.js"
import { PixelSize } from "../../plotting/ipld/ipldmodel/OtherDataTypes.js"
import { Nominal } from "./Nominal.js"

const CIDStringName: unique symbol = Symbol("CID name")
const LiteCIDStringName: unique symbol = Symbol("LiteCID name")

const Prefix: unique symbol = Symbol("Prefix")
const Suffix: unique symbol = Symbol("Suffix")
const Pixels: unique symbol = Symbol("Pixels")
const Painted: unique symbol = Symbol("Painted")

const ULIDName: unique symbol = Symbol("ULID name")

const PaintGeometryName: unique symbol = Symbol("Paint Geometry Name")
// const PixelWidthName: unique symbol = Symbol("Pixel Width name")
// const PixelHeightName: unique symbol = Symbol("Pixel Height name")
// const PixelSizeName: unique symbol = Symbol("Pixel Size")

// const RegionWidthName: unique symbol = Symbol("Region Width name")
// const RegionHeightName: unique symbol = Symbol("Region Height name")

// const RegionLeftName: unique symbol = Symbol("Region Left name")
// const RegionRightName: unique symbol = Symbol("Region Right name")
// const RegionTopName: unique symbol = Symbol("Region Top name")
// const RegionBottomName: unique symbol = Symbol("Region Bottom name")

const WorkloadIdName: unique symbol = Symbol("Workload Id Name")
const ReleaseVersionName: unique symbol = Symbol("Release Version Name")
const BuildVersionName: unique symbol = Symbol("Build Version Name")

/**
 * A string that has been validated as a legitimate CID format.
 * Use CIDUtil.blessCID() to convert from LiteCIDString after validation.
 */
export type CIDString = Nominal<string, typeof CIDStringName>

/**
 * A string that is intended to be a CID but has not yet been validated.
 * This is used in application-facing DTOs where CID format validation
 * is deferred to the framework (e.g., FlowProducer).
 *
 * The "Lite" prefix indicates this type carries intent without validation,
 * keeping application code free of multiformats dependency.
 */
export type LiteCIDString = Nominal<string, typeof LiteCIDStringName>

export type PrefixString = Nominal<string, typeof Prefix>
export type SuffixString = Nominal<string, typeof Suffix>
export type AnyAffixString = PrefixString & SuffixString

export type PrefixData = Nominal<Uint8ClampedArray, typeof Prefix>
export type SuffixData = Nominal<Uint8ClampedArray, typeof Suffix>
export type AnyAffixData = PrefixData & SuffixData

export interface PaintGeometrySidecar {
   _geometry: PaintResolution
}

export type PixelsString = Nominal<string, typeof Pixels>
export type PixelsData = Nominal<Uint8ClampedArray, typeof Pixels> &
   PaintGeometrySidecar

export type PaintedString = Nominal<string, typeof Painted> &
   PaintGeometrySidecar
export type PaintedData = Nominal<Buffer, typeof Painted>

// export type PixelWidth = Nominal<number, typeof PixelWidthName>
// export type PixelHeight = Nominal<number, typeof PixelHeightName>

// export type RegionLeft = Nominal<number, typeof RegionLeftName>
// export type RegionRight = Nominal<number, typeof RegionRightName>

// export type RegionTop = Nominal<number, typeof RegionTopName>
// export type RegionBottom = Nominal<number, typeof RegionBottomName>

// export type RegionWidth = Nominal<number, typeof RegionWidthName>
// export type RegionHeight = Nominal<number, typeof RegionHeightName>

// export type PixelSize = Nominal<number, typeof PixelSizeName>
export type PaintGeometry = Nominal<PlotMapGeometry, typeof PaintGeometryName>

export type ULIDString = Nominal<string, typeof ULIDName>

export type WorkloadId = Nominal<string, typeof WorkloadIdName>
export type ReleaseVersion = Nominal<string, typeof ReleaseVersionName>
export type BuildVersion = Nominal<string, typeof BuildVersionName>
