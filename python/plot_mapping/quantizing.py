from precise_grid import compute_dimensions, plot_points
from plot_mapping_pb2 import *

width = 1024
height = 1024
xmin = -1.0
xmax = 1.0
ymin = -1.0
ymax = 1.0

pixel_heights, frame_heights, pixel_lengths, frame_lengths = compute_dimensions(height, ymin, ymax, width, xmin, xmax)
pixel_points, frame_points = plot_points(pixel_heights, frame_heights, pixel_lengths, frame_lengths)


fDocument = PointPlotDocument()
fDocument.data.pixelRef = RefPoint.CENTER
fDocument.data.resolution.pixelWidth = width;
fDocument.data.resolution.pixelHeight = height;
fDocument.data.mapped_region.top = ymax;
fDocument.data.mapped_region.bottom = ymin;
fDocument.data.mapped_region.left = xmin;
fDocument.data.mapped_region.right = xmax;
fDocument.data.uniform = True
fDocument.data.rows.extend(frame_points[:,:,0].reshape([width*height]))
fDocument.data.columns.extend(frame_points[:,:,1].reshape([width*height]))

file = open("qdoc.proto", "wb")
file.write(
  fDocument.SerializeToString())
file.close()

