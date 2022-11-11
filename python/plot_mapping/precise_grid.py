import numpy as np

PIXEL_COUNT = 480
DIMENSION_MIN = -1
DIMENSION_MAX = 1

PIXEL_WIDTH = 640
PIXEL_HEIGHT = 480
OUTPUT_SHAPE = [PIXEL_HEIGHT, PIXEL_WIDTH]
p
TOP = 1
BOTTOM = -1
LEFT = 1
RIGHT = -1


def check_resolution(pixel_height, pixel_width, pixel_unit):
    """
    Ensure that pixel_height x pixel_width can be evenly composed of pixels that are (pixel_unit x pixel_unit) 
    in size.  For example, (480x640) resolution cannot be expressed with pixel sizes of either 12 or 64.  Although
    480 / 12 = 40 and 640 / 64 = 10, the other dimension fails to divide evenly, with 640/12 = 53.3333 and 
    480 / 64 = 7.5.  But this resolution may use a pixel size of 20, because 480/20 = 24 and 640/20 = 32.
    """
    assert (pixel_height / pixel_unit) == (pixel_height // pixel_unit)
    assert (pixel_width / pixel_unit) == (pixel_width // pixel_unit)
    return True


def check_proportions(pixel_height, bottom, top, pixel_width, left, right, fix_by='matched'):
    pixel_ratio = 1.0 * pixel_height / pixel_width
    height = top - bottom
    width = right - left
    ratio = 1.0 * height / width
    if ratio == pixel_ratio:
        return bottom, top, left, right
    if fix_by == 'matched':
        raise ValueError(
            f"Pixel ratio of {pixel_ratio} does not match plot region ratio of {ratio}.  Must fit or fill to compensate...")
    fix_scale = ratio / pixel_ratio
    if fix_by == 'to_fit':
        if pixel_ratio < ratio:
            top = top / fix_scale
            bottom = bottom / fix_scale
        else:
            left = left * fix_scale
            right = right * fix_scale
    elif fix_by == 'to_fill':
        if pixel_ratio > ratio:
            top = top / fix_scale
            bottom = bottom / fix_scale
        else:
            left = left * fix_scale
            right = right * fix_scale
    else:
        raise ValueError(
            f"{fix_by} is neither 'matched', 'to_fit', or 'to_fill'")
    return bottom, top, left, right


def compute_dimensions(pixel_height, bottom, top, pixel_width, left, right, pixel_unit=1):
    print(bottom, top, 2*pixel_height//pixel_unit)
    frame_heights = np.linspace(bottom, top, 2*pixel_height//pixel_unit, endpoint=False) \
        .reshape([pixel_height//pixel_unit, 2]) \
        .transpose([1, 0])[1]
    print(left, right, 2*pixel_width//pixel_unit)
    frame_lengths = np.linspace(left, right, 2*pixel_width//pixel_unit, endpoint=False) \
        .reshape([pixel_width//pixel_unit, 2]) \
        .transpose([1, 0])[1]
    pixel_heights = np.array([*range(0, pixel_height)]) \
        .reshape(pixel_height//pixel_unit, pixel_unit) \
        .transpose()[0]
    pixel_lengths = np.array([*range(0, pixel_width)]) \
        .reshape(pixel_width//pixel_unit, pixel_unit) \
        .transpose()[0]
    return pixel_heights, frame_heights, pixel_lengths, frame_lengths


def plot_points(pixel_heights, frame_heights, pixel_lengths, frame_lengths):
    height_count = len(pixel_heights)
    length_count = len(pixel_lengths)
    assert height_count == len(frame_heights)
    assert length_count == len(frame_lengths)
    # Frame matrix
    frame_height_matrix = frame_heights.reshape(
        [height_count, 1]).repeat(length_count, 1)
    frame_length_matrix = frame_lengths.reshape(
        [1, length_count]).repeat(height_count, 0)
    frame_points = np.array(
        [frame_height_matrix, frame_length_matrix]).transpose(1, 2, 0)
    # Pixel matrix
    pixel_height_matrix = pixel_heights.reshape(
        [height_count, 1]).repeat(length_count, 1)
    pixel_length_matrix = pixel_lengths.reshape(
        [1, length_count]).repeat(height_count, 0)
    pixel_points = np.array(
        [pixel_height_matrix, pixel_length_matrix]).transpose(1, 2, 0)
    # TODO: Combine these two [x, y, 2] shaped matrices into a single [x, y, 4] matrix?
    return pixel_points, frame_points
