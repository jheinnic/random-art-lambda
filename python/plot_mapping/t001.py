from precise_grid import compute_dimensions_v2
from plot_mapping_pb2 import *

width = 1024
height = 1024
xmin = -1.0
xmax = 1.0
ymin = -1.0
ymax = 1.0

pixel_lengths, frame_lengths, pixel_heights, frame_heights = compute_dimensions_v2(width, xmin, xmax, height, ymin, ymax)


fDocument = PointPlotDocument()
fDocument.data.pixelRef = RefPoint.TOP_LEFT
fDocument.data.resolution.pixelWidth = width;
fDocument.data.resolution.pixelHeight = height;
fDocument.data.mapped_region.top = ymax;
fDocument.data.mapped_region.bottom = ymin;
fDocument.data.mapped_region.left = xmin;
fDocument.data.mapped_region.right = xmax;
fDocument.data.uniform = False
fDocument.data.rows.extend(frame_lengths)
fDocument.data.columns.extend(frame_heights)

file = open("tdoc-n10000_10000_1024-n10000_10000_1024.proto", "wb")
file.write(
  fDocument.SerializeToString())
file.close()
