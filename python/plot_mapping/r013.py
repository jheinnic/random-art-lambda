from precise_grid import compute_dimensions, plot_points
from plot_mapping_pb2 import *

width = 1536
height = 1536
xmin = -12.0
xmax = 12.0
ymin = -12.0
ymax = 12.0

pixel_lengths, frame_lengths, pixel_heights, frame_heights = compute_dimensions(width, xmin, xmax, height, ymin, ymax)
pixel_points, frame_points = plot_points(pixel_lengths, frame_lengths, pixel_heights, frame_heights)


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

file = open("rdoc-n120_120_1536-n120_120_1536.proto", "wb")
file.write(
  fDocument.SerializeToString())
file.close()

