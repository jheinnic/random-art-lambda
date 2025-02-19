from precise_grid import compute_dimensions, plot_points
from plot_mapping_pb2 import *

width = 1024
height = 1024
xmin = -0.85
xmax = -0.55
ymin = -0.85
ymax = -0.55

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

file = open("rdoc-n085_n055_1024-n085_n055_1024.proto", "wb")
file.write(
  fDocument.SerializeToString())
file.close()

