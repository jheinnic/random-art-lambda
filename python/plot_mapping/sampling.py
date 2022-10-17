from turtle import width
from plot_mapping_pb2 import *
from scipy.spatial.distance import pdist
from skopt.sampler import Grid
from skopt.sampler import Hammersly
from skopt.sampler import Halton
from skopt.sampler import Lhs
from skopt.sampler import Sobol
from skopt.space import Space
import matplotlib.pyplot as plt
import matplotlib
import numpy as np
import math
print(__doc__)
np.random.seed(1234)

# matplotlib.use("Agg")


def plot_searchspace(x, title):
    fig, ax = plt.subplots()
    plt.plot(np.array(x)[:, 0], np.array(x)[:, 1], 'bo', label='samples')
    plt.plot(np.array(x)[:, 0], np.array(x)[:, 1],
             'bs', markersize=0.00001, alpha=0.1)
    # ax.legend(loc="best", numpoints=1)
    ax.set_xlabel("X1")
    ax.set_xlim([xmin, xmax])
    ax.set_ylabel("X2")
    ax.set_ylim([ymin, ymax])
    plt.title(title)
    ax.grid(True)


def plot_pixelspace(x, title):
    fig, ax = plt.subplots()
    plt.plot(np.array(x)[:, 0], np.array(x)[:, 1],
             'bo', label='samples')
    plt.plot(np.array(x)[:, 0], np.array(x)[:, 1],
             'bs', markersize=0.001, alpha=0.1)
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


def create_plot_maps(_width, _height, top, left, bottom, right, f_doc="fdoc.proto", g_doc="gdoc.proto", h_doc="hdoc.proto", sample_multi=5.73, seed=1234):
    global width
    global height
    global xmin
    global xmax
    global ymin
    global ymax
    width = _width
    height = _height
    xmin = left
    xmax = right
    ymin = bottom
    ymax = top

    space = Space([(xmin, xmax), (ymin, ymax)])
    n_samples = math.floor(width * height * sample_multi)

    hammersly = Hammersly()
    # hammersly = Halton()
    xx = np.array(hammersly.generate(space.dimensions, n_samples))
    px = np.ndarray([n_samples, 2], 'uint16')
    px[:, 0] = np.floor(((xx[:, 0] - xmin) / (xmax - xmin))
                        * width).astype('uint16')
    px[:, 1] = np.floor(((xx[:, 1] - ymin) / (ymax - ymin))
                        * height).astype('uint16')
    plot_searchspace(xx, 'Hammersly')
    print("empty fields: %d" %
          ((width*height) - np.size(np.unique(px, axis=0), 0)))
    plt.show()

    xp = []
    yp = []
    f = np.ndarray([width, height, 2], 'float64')
    f[:, :, :] = -1
    g = np.ndarray([width, height, 2], 'float64')
    g[:, :, :] = -1
    h = np.ndarray([width, height, 2], 'float64')
    h[:, :, :] = -1
    n = np.ndarray([width, height], 'int8')
    n[:, :] = 0
    for ii in np.arange(n_samples):
        xi = px[ii, 0]
        yi = px[ii, 1]
        vi = xx[ii]
        if n[xi, yi] > 0:
            # print(f"({xi}, {yi}) => [(${g[xi,yi,0]}, ${g[xi,yi,1]}), (${vi[0]}, ${vi[1]})]")
            g[xi, yi, :] = (g[xi, yi, :] + vi) / 2
            h[xi, yi, :] = (h[xi, yi, :] + vi)
        else:
            h[xi, yi, :] = g[xi, yi, :] = f[xi, yi, :] = vi
            xp.append(xi)
            yp.append(yi)
        n[xi, yi] = n[xi, yi] + 1

    # xd = np.ndarray([len(xp), 2], 'uint16')
    # xd[:,0] = xp
    # xd[:,1] = yp
    # plot_pixelspace(xd, 'Digitized Hammerly')
    # plt.show()
    f = f.reshape([width * height, 2])
    plot_searchspace(f, 'Sampled with first fixed resoution')
    plt.show()
    g = g.reshape([width * height, 2])
    plot_searchspace(g, 'Sampled with incremental averaging')
    plt.show()
    n2 = np.ndarray([width, height, 2], 'int8')
    n2[:, :, 0] = n
    n2[:, :, 1] = n
    print(h)
    print(n2)
    h[:, :, :] = h / n2
    print(h)
    h = h.reshape([width * height, 2])
    plot_searchspace(h, 'Sampled with unbiased averaging')
    plt.show()
    # plt.show()

    f_document = PointPlotDocument()
    f_document.data.pixelRef = RefPoint.CENTER
    f_document.data.resolution.pixelWidth = width
    f_document.data.resolution.pixelHeight = height
    f_document.data.mapped_region.top = ymax
    f_document.data.mapped_region.bottom = ymin
    f_document.data.mapped_region.left = xmin
    f_document.data.mapped_region.right = xmax
    f_document.data.uniform = False
    f_document.data.rows.extend(f[:, 0].reshape([width*height]))
    f_document.data.columns.extend(f[:, 1].reshape([width*height]))

    file = open(f_doc, "wb")
    file.write(
        f_document.SerializeToString())
    file.close()

    g_document = PointPlotDocument()
    g_document.data.pixelRef = RefPoint.CENTER
    g_document.data.resolution.pixelWidth = width
    g_document.data.resolution.pixelHeight = height
    g_document.data.mapped_region.top = ymax
    g_document.data.mapped_region.bottom = ymin
    g_document.data.mapped_region.left = xmin
    g_document.data.mapped_region.right = xmax
    g_document.data.uniform = False
    g_document.data.rows.extend(g[:, 0].reshape([width*height]))
    g_document.data.columns.extend(g[:, 1].reshape([width*height]))
    file = open(g_doc, "wb")
    file.write(
        g_document.SerializeToString())
    file.close()

    h_document = PointPlotDocument()
    h_document.data.pixelRef = RefPoint.CENTER
    h_document.data.resolution.pixelWidth = width
    h_document.data.resolution.pixelHeight = height
    h_document.data.mapped_region.top = ymax
    h_document.data.mapped_region.bottom = ymin
    h_document.data.mapped_region.left = xmin
    h_document.data.mapped_region.right = xmax
    h_document.data.uniform = False
    h_document.data.rows.extend(g[:, 0].reshape([width*height]))
    h_document.data.columns.extend(g[:, 1].reshape([width*height]))
    file = open(h_doc, "wb")
    file.write(
        h_document.SerializeToString())
    file.close()
