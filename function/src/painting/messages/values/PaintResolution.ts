/**
 * RegionSpec describing the space a RandomArt painting visualizes and at what
 * resolution.  The properties here describe the geometry of the target space,
 * but does not directly specify the individual plot coordinates of each pixel.
 *
 * TODO: IF a 640x480 plot has a pixel size of 4, does this interface claim
 * it's 640x480 with pixel size of 4, or is it 160x120 with a pixel size of 4.
 */
export interface PaintResolution {
   readonly pixelWidth: number
   readonly pixelHeight: number
   readonly pixelSize: number
}
