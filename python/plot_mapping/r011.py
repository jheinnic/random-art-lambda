from precise_grid import compute_dimensions, plot_points
from plot_mapping_pb2 import *

# shift almost one full quad to the upper left.

width = 1024
height = 1024
xmin = -2.8
xmax = -0.8
ymin = 0.8
ymax = 2.8

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

file = open("rdoc-n28_n08_1024-08_28_1024.proto", "wb")
file.write(
  fDocument.SerializeToString())
file.close()

