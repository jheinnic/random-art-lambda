from precise_grid import compute_dimensions, plot_points
from plot_mapping_pb2 import *
import numpy as np
import math

width = 640
height = 640
xmin = 0.25
xmax = 1.75
ymin = -1.75
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

fp0 = frame_points[0].flatten()
fp1 = frame_points[1].flatten()
# fps = np.size(fp1) - 1
# fpd = [fp1[ii+1] - fp1[ii] for ii in range(0, fps)]
# fpdn = np.array(fpd)
# dmax = np.max(fpdn)
# dmin = np.min(fpdn)
# print(dmin)
# print(dmax)
# #dmax = 0.0023437499999998668
# dmax=0.0023437499999998668
# for ii in range(0, fps):
#     delta = fp1[ii+1] - fp1[ii]
#     if (delta > dmin) and (delta < dmax):
#         print("Delta is " + str(delta) + " at " + str(ii))
#         print(str(delta) + " > " + str(dmin))

fromY = math.ceil(height / 2)
ii = (width * fromY)
iMax = width * height
while ii < iMax:
    print("(%f, %f)" % (fp0[ii], fp1[ii]))
    ii = ii + 1

# file = open("qdoc-025_175_640-n175_n025_640.proto", "wb")
# file.write(
#   fDocument.SerializeToString())
# file.close()

