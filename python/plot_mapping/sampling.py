print(__doc__)
import math
import numpy as np
np.random.seed(1234)

import matplotlib
# matplotlib.use("Agg")
import matplotlib.pyplot as plt

from skopt.space import Space
from skopt.sampler import Sobol
from skopt.sampler import Lhs
from skopt.sampler import Halton
from skopt.sampler import Hammersly
from skopt.sampler import Grid
from scipy.spatial.distance import pdist

from plot_mapping_pb2 import *

def plot_searchspace(x, title):
    fig, ax = plt.subplots()
    plt.plot(np.array(x)[:, 0], np.array(x)[:, 1], 'bo', label='samples')
    plt.plot(np.array(x)[:, 0], np.array(x)[:, 1], 'bs', markersize=0.001, alpha=0.1)
    # ax.legend(loc="best", numpoints=1)
    ax.set_xlabel("X1")
    ax.set_xlim([xmin, xmax])
    ax.set_ylabel("X2")
    ax.set_ylim([ymin, ymax])
    plt.title(title)
    ax.grid(True)

def plot_pixelspace(x, title):
    fig, ax = plt.subplots()
    plt.plot(np.array(x)[:, 0], np.array(x)[:, 1], 'bo', label='samples')
    plt.plot(np.array(x)[:, 0], np.array(x)[:, 1], 'bs', markersize=0.001, alpha=0.1)
    # ax.legend(loc="best", numpoints=1)
    ax.set_xlabel("X1")
    ax.set_xlim([0, width])
    ax.set_ylabel("X2")
    ax.set_ylim([0, height])
    plt.title(title)
    ax.grid(True)


width = 1024
height = 1024
xmin = -1.0
xmax = 1.0
ymin = -1.0
ymax = 1.0

space = Space([(xmin, xmax), (ymin, ymax)])
n_samples = math.floor(width * height * 5.73)

hammersly = Hammersly()
#hammersly = Halton()
xx = np.array(hammersly.generate(space.dimensions, n_samples))
px = np.ndarray([n_samples, 2], 'uint16')
px[:,0] = np.floor(((xx[:,0] - xmin) / (xmax - xmin)) * width).astype('uint16')
px[:,1] = np.floor(((xx[:,1] - ymin) / (ymax - ymin)) * height).astype('uint16')
plot_searchspace(xx, 'Hammersly')
print("empty fields: %d" % ((width*height) - np.size(np.unique(px, axis=0), 0)))
# plt.show()

xp = []
yp = []
f = np.ndarray([width, height, 2], 'float64')
f[:,:,:] = -1
g = np.ndarray([width, height, 2], 'float64')
g[:,:,:] = -1
for ii in np.arange(n_samples):
    xi = px[ii, 0]
    yi = px[ii, 1]
    vi = xx[ii]
    if g[xi, yi, 0] != -1:
        # print(f"({xi}, {yi}) => [(${g[xi,yi,0]}, ${g[xi,yi,1]}), (${vi[0]}, ${vi[1]})]")
        g[xi, yi, :] = (g[xi, yi, :] + vi) / 2
    else:
        g[xi, yi, :] = f[xi, yi, :] = vi
        xp.append(xi)
        yp.append(yi)

# xd = np.ndarray([len(xp), 2], 'uint16')
# xd[:,0] = xp
# xd[:,1] = yp
# plot_pixelspace(xd, 'Digitized Hammerly')
# plt.show()
f = f.reshape([width * height, 2])
plot_searchspace(f, 'Sampled with first fixed resoution')
g = g.reshape([width * height, 2])
plot_searchspace(g, 'Sampled with conflict averaging')
# plt.show()

fDocument = PointPlotDocument()
fDocument.data.pixelRef = RefPoint.CENTER
fDocument.data.resolution.pixelWidth = width;
fDocument.data.resolution.pixelHeight = height;
fDocument.data.mapped_region.top = ymax;
fDocument.data.mapped_region.bottom = ymin;
fDocument.data.mapped_region.left = xmin;
fDocument.data.mapped_region.right = xmax;
fDocument.data.uniform = False
fDocument.data.rows.extend(f[:,0].reshape([width*height]))
fDocument.data.columns.extend(f[:,1].reshape([width*height]))

file = open("fdoc.proto", "wb")
file.write(
  fDocument.SerializeToString())
file.close()

gDocument = PointPlotDocument()
gDocument.data.pixelRef = RefPoint.CENTER
gDocument.data.resolution.pixelWidth = width;
gDocument.data.resolution.pixelHeight = height;
gDocument.data.mapped_region.top = ymax;
gDocument.data.mapped_region.bottom = ymin;
gDocument.data.mapped_region.left = xmin;
gDocument.data.mapped_region.right = xmax;
gDocument.data.uniform = False
gDocument.data.rows.extend(g[:,0].reshape([width*height]))
gDocument.data.columns.extend(g[:,1].reshape([width*height]))
file = open("gdoc.proto", "wb")
file.write(
  gDocument.SerializeToString())
file.close()

