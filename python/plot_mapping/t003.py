from precise_grid import compute_dimensions_v2 
from plot_mapping_pb2 import *

width = 512
height = 512
xmin = 0.5
xmax = 2.5
ymin = 0.5
ymax = 2.5

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

file = open("tdoc-05000_25000_512-05000_25000_512.proto", "wb")
file.write(
  fDocument.SerializeToString())
file.close()

