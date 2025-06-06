from precise_grid import compute_dimensions, plot_points
from plot_mapping_pb2 import *

# Initial region becomes the center 1x1 of a 3x3 square

width = 1536
height = 1536
xmin = -3.0
xmax = 3.0
ymin = -3.0
ymax = 3.0

pixel_lengths, frame_lengths, pixel_heights, frame_heights = compute_dimensions(width, xmin, xmax, height, ymin, ymax)


fDocument = PointPlotDocument()
fDocument.data.pixelRef = RefPoint.CENTER
fDocument.data.resolution.pixelWidth = width;
fDocument.data.resolution.pixelHeight = height;
fDocument.data.mapped_region.top = ymax;
fDocument.data.mapped_region.bottom = ymin;
fDocument.data.mapped_region.left = xmin;
fDocument.data.mapped_region.right = xmax;
fDocument.data.uniform = True
fDocument.data.rows.extend(frame_lengths)
fDocument.data.columns.extend(frame_heights)

file = open("rdoc-n30_30_1536-n30_30_1536.proto", "wb")
file.write(
  fDocument.SerializeToString())
file.close()

