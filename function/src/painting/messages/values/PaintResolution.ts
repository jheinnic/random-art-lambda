/**
 * RegionSpec describing the space a RandomArt painting visualizes and at what
 * resolution.  The properties here describe the geometry of the target space,
 * but does not directly specify the individual plot coordinates of each pixel.
 */
export interface PaintResolution {
   readonly width: number
   readonly height: number
   readonly size: number
}
