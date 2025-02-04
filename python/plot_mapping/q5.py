from precise_grid import compute_dimensions, plot_points
from plot_mapping_pb2 import *

width = 640
height = 640
xmin = 0.4985
xmax = 0.5015
ymin = -0.5015
ymax = -0.4985

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

file = open("qdoc-04985_05015_640-n05015_n04985_640.proto", "wb")
file.write(
  fDocument.SerializeToString())
file.close()

