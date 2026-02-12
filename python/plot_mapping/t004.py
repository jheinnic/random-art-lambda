from precise_grid import compute_dimensions_v2 
from plot_mapping_pb2 import *

width = 640
height = 640
xmin = 0.40
xmax = 0.60
ymin = -0.60
ymax = -0.40

pixel_lengths, frame_lengths, pixel_heights, frame_heights = compute_dimensions_v2(width, xmin, xmax, height, ymin, ymax)


fDocument = PointPlotDocument()
fDocument.data.pixelRef = RefPoint.TOP_LEFT
fDocument.data.resolution.pixelWidth = width;
fDocument.data.resolution.pixelHeight = height;
fDocument.data.mapped_region.top = ymax;
fDocument.data.mapped_region.bottom = ymin;
fDocument.data.mapped_region.left = xmin;
fDocument.data.mapped_region.right = xmax;
fDocument.data.uniform = True
fDocument.data.rows.extend(frame_lengths)
fDocument.data.columns.extend(frame_heights)

file = open("tdoc-04000_06000_640-n06000_n04000_640.proto", "wb")
file.write(
  fDocument.SerializeToString())
file.close()

