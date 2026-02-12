import type { CIDString } from "../../../messages/interface/NamedValues.js"

/**
 * Reference to plot data (RegionMap coordinates) for a painting task.
 *
 * Two forms:
 * - PlotDataNameRef: Name-only reference requiring lookup in a project catalog
 * - PlotDataCIDRef: Direct CID reference (optionally with a friendly name)
 *
 * Type guards use structural checks (property presence) rather than a
 * discriminator field, ensuring they work correctly after JSON serialization.
 */
export type PlotDataRef = PlotDataNameRef | PlotDataCIDRef

/**
 * Name-only reference to plot data.
 *
 * Requires a project-level catalog to resolve the name to a CID.
 * Used in multi-task project specs where tasks reference RegionMaps by name.
 */
export interface PlotDataNameRef {
   /**
    * A name mapped by a project-level registry to a CID for the RegionMap.
    */
   readonly regionMapName: string

   /** Discriminator: name-only refs have no CID */
   readonly regionMapCID?: undefined
}

/**
 * Direct CID reference to plot data.
 *
 * Contains the CID needed to load the RegionMap. Optionally includes a
 * friendly name for logging/display purposes.
 */
export interface PlotDataCIDRef {
   /**
    * Optional friendly name for logging. When omitted, the CID is used instead.
    */
   readonly regionMapName?: string

   /**
    * CID that retrieves the RegionMap data file containing plot coordinates.
    */
   readonly regionMapCID: CIDString
}

/**
 * Check if the reference includes a CID (can be used directly for loading).
 */
export function hasRefByCID(ref: PlotDataRef): ref is PlotDataCIDRef {
   return ref.regionMapCID != null
}

/**
 * Check if the reference is name-only (requires catalog lookup).
 */
export function isRefByName(ref: PlotDataRef): ref is PlotDataNameRef {
   return ref.regionMapCID == null
}
