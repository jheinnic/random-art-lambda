/**
 * Relative to the context of an associated RegionSpatialSpec, this
 * value object describes a single horizontal subsection of the
 * overall whole region.  This is identified by the index offset of
 * the first row included, followed by the index offset of the first
 * row to then be excluded.
 */
export interface CanvasFragment {
   readonly fragmentIndex: number
   readonly totalFragmentsCount: number
   readonly fragmentFirstRow: number
   readonly fragmentLastRow: number
}
