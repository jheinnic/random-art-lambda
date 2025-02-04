from precise_grid import compute_dimensions, plot_points
from plot_mapping_pb2 import *

width = 512
height = 512
xmin = 0.25
xmax = 0.75
ymin = -0.75
ymax = -0.25

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
fDocument.data.uniform = False
fDocument.data.rows.extend(frame_points[0].flatten())
fDocument.data.columns.extend(frame_points[1].flatten())

file = open("qdoc-025_075_512-n075_n025_512.proto", "wb")
file.write(
  fDocument.SerializeToString())
file.close()

