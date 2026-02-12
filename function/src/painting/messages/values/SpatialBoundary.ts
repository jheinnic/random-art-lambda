/**
 * RegionSpec describing the space a RandomArt painting visualizes and at what
 * resolution.  The properties here describe the geometry of the target space,
 * but does not directly specify the individual plot coordinates of each pixel.
 */
export interface SpatialBoundary {
   readonly left: number
   readonly right: number
   readonly top: number
   readonly bottom: number
}
