import cv2
import matplotlib.pyplot as plt
import sys
from PIL import Image
from io import BytesIO
import numpy as np 
from skimage.io import imread, imsave

# The values of alpha and beta weigh the blend to one source or the other
alpha = 0.5  
beta  = 1 - alpha  # beta=0.5
def old_blend_regions(region0, region1):
    return cv2.addWeighted(region0, alpha, region1, beta, 0)

def get_slices(label, from_pixels, shape):
   top_left_x = int(from_pixels[0])
   top_left_y = int(from_pixels[1])
   print(label, " :: ", top_left_x, shape[0], top_left_y, shape[1])
   slices = [slice(top_left_x, top_left_x + shape[0]), slice(top_left_y, top_left_y + shape[1])]
   return slices

def get_region(label, images, source_indices, from_pixels, shape):
   source = images[source_indices[0]][source_indices[1]]
   slices = get_slices(label, from_pixels, shape)
   region = source[slices[0], slices[1]]
   return region

def apply_region_spec(region_spec, imgs_prep, merged):
   print(region_spec)
   print(imgs_prep.shape)
   shape = region_spec["shape"]
   instances = region_spec["instances"]
   source_index = np.array(region_spec["source_index"]).transpose([1,2,0,3])
   merge_from = np.array(region_spec["merge_from"]).transpose([1,2,0,3])
   merge_to = region_spec["merge_to"]
   for x in range(0, instances[0]):
       for y in range(0, instances[1]):
          region_from = get_region("from", imgs_prep, source_index[x][y][0], merge_from[x][y][0], shape)
          to_slices = get_slices("to", merge_to[x][y], shape)
          merged[to_slices[0], to_slices[1]] = region_from

def overlap_region_spec(region_spec, imgs_prep, orientation, merged):
   print(region_spec)
   print(imgs_prep.shape)
   shape = region_spec["shape"]
   instances = region_spec["instances"]
   source_index = np.array(region_spec["source_index"]).transpose([1,2,0,3])
   merge_from = np.array(region_spec["merge_from"]).transpose([1,2,0,3])
   merge_to = region_spec["merge_to"]
   for x in range(0, instances[0]):
       for y in range(0, instances[1]):
          region_from0 = get_region("from0", imgs_prep, source_index[x][y][0], merge_from[x][y][0], shape)
          region_from1 = get_region("from1", imgs_prep, source_index[x][y][1], merge_from[x][y][1], shape)

          blended_from = blend_regions(region_from0, region_from1, orientation)
          print(region_from0.sum(), region_from1.sum(), blended_from.sum())
          print((region_from0-blended_from).sum(), (region_from1-blended_from).sum(), (region_from0-region_from1).sum(), (region_from1 - region_from0).sum())

          to_slices = get_slices("to", merge_to[x][y], shape)
          merged[to_slices[0], to_slices[1]] = blended_from

def quad_region_spec(region_spec, imgs_prep, merged):
   shape = region_spec["shape"]
   instances = region_spec["instances"]
   source_index = np.array(region_spec["source_index"]).transpose([1,2,0,3])
   merge_from = np.array(region_spec["merge_from"]).transpose([1,2,0,3])
   merge_to = region_spec["merge_to"]
   
   for x in range(0, instances[0]):
       for y in range(0, instances[1]):
          region_from0 = get_region("from0", imgs_prep, source_index[x][y][0], merge_from[x][y][0], shape)
          region_from1 = get_region("from1", imgs_prep, source_index[x][y][1], merge_from[x][y][1], shape)
          region_from2 = get_region("from2", imgs_prep, source_index[x][y][2], merge_from[x][y][2], shape)
          region_from3 = get_region("from3", imgs_prep, source_index[x][y][3], merge_from[x][y][3], shape)

          # This is unique to this function--blending the two source regions
          blended_from = blend_regions(
                  blend_regions(region_from0, region_from1, "vertical"),
                  blend_regions(region_from2, region_from3, "vertical"),
                  "horizontal"
          )

          to_slices = get_slices("to", merge_to[x][y], shape)
          merged[to_slices[0], to_slices[1]] = blended_from

def build_pyramid(image, levels):
    """
    Builds a Laplacian pyramid from an image.
    """
    gaussian_pyramid = [image]
    for _ in range(levels):
        image = cv2.pyrDown(image)
        gaussian_pyramid.append(image)

    laplacian_pyramid = [gaussian_pyramid[levels - 1]]
    for i in range(levels - 1, 0, -1):
        # Resize to match the original dimension before subtraction
        gaussian_extended = cv2.pyrUp(gaussian_pyramid[i], dstsize=gaussian_pyramid[i-1].shape[:2][::-1])
        laplacian = cv2.subtract(gaussian_pyramid[i - 1], gaussian_extended)
        laplacian_pyramid.append(laplacian)
    return laplacian_pyramid


def blend_pyramids(pyramid1, pyramid2, mask_pyramid):
    """
    Blends two Laplacian pyramids using a mask pyramid.
    """
    blended_pyramid = []
    # Note: Pyramids are built in reverse order (bottom to top), so we iterate in reverse
    for i in range(len(pyramid1) - 1, -1, -1):
        l_a = pyramid1[i]
        l_b = pyramid2[i]
        m = mask_pyramid[i]

        m_3ch = cv2.merge([m, m, m])
        blended = (l_a * m_3ch) + (l_b * (1.0 - m_3ch))
        blended_pyramid.append(blended)
    
    # Reverse the blended pyramid to match reconstruction order
    blended_pyramid.reverse()
    return blended_pyramid

def reconstruct_image(pyramid):
    """
    Reconstructs the final image from a Laplacian pyramid.
    
    The key fix is adding np.clip to prevent negative values from being
    clipped to 0 during the final uint8 conversion.
    """
    reconstructed_image = pyramid[0]
    for i in range(1, len(pyramid)):
        # Ensure dimensions match before adding
        upsampled_image = cv2.pyrUp(reconstructed_image, dstsize=pyramid[i].shape[:2][::-1])
        reconstructed_image = cv2.add(upsampled_image, pyramid[i])
    
    return reconstructed_image

levels = 0
rng = np.random.default_rng()
def blend_regions(region0, region1, orientation):
    if (region0.shape != region1.shape):
        raise Exception("Region shapes are not equal: " + str(region0.shape) + " != " + str(region1.shape))
    (M, N) = region0.shape[0:2]

    laplacian0 = build_pyramid(region0.astype(np.float64) / 255, levels)
    laplacian1 = build_pyramid(region1.astype(np.float64) / 255, levels)

    # Create and build a Laplacian pyramid for the mask.  Use a linear gradient.
    if orientation == "horizontal":
        mask = np.tile(np.linspace(1.0, 0.0, N, dtype=np.float64), (M, 1))
    elif orientation == "vertical":
        mask = np.tile(np.linspace(1.0, 0.0, M, dtype=np.float64), (N, 1))
        mask = mask.transpose((1, 0))
    elif orientation == "diagonal":
        maskH = np.tile(np.linspace(1.0, 0.0, N, dtype=np.float64), (M, 1))
        maskV = np.tile(np.linspace(1.0, 0.0, M, dtype=np.float64), (N, 1))
        maskV = mask.transpose((1, 0))
        mask = maskH * maskV
    else:
        raise Exception( orientation + " is neither horizontal, vertical, or diagonal" )
    #mask = np.linspace(1.0, 0.0, M * N, dtype=np.float64)
    #rng.shuffle(mask)
    #mask = mask.reshape((M, N))
    mask_pyramid = build_pyramid(mask, levels)

    # Blend the two Laplacian pyramids
    blended_pyramid = blend_pyramids(laplacian0, laplacian1, mask_pyramid)

    # Reconstruct the final image, clip it to a normalized range of [0.0, 1.0],
    # and then quantize back to 8-bit values.
    blended_image = reconstruct_image(blended_pyramid)
    blended_image = np.clip(blended_image, 0.0, 1.0) * 255
    return blended_image.astype(np.uint8)


# Image URLs
expected_rows = int(sys.argv[1])
expected_cols = int(sys.argv[2])
expected_files = expected_rows * expected_cols
input_files = sys.argv[3:3 + expected_files]
imgs = [imread(input_file) for input_file in input_files]
shapes = [ii.shape for ii in imgs]

imgs_prep = [cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR) for img in imgs]
imgs_prep = np.array(imgs_prep).reshape((expected_rows,expected_cols,shapes[0][0],shapes[0][1],3))
print(imgs_prep.shape)
initial_shape = imgs_prep.shape

row_count = initial_shape[0]
col_count = initial_shape[1]
row_height_in = initial_shape[2]
col_width_in = initial_shape[3]
alignment_grid = 12

row_corner_height = int(row_height_in / alignment_grid)
col_corner_width = int(col_width_in / alignment_grid)
row_overlap_height = row_corner_height
col_overlap_width = col_corner_width
row_center_height = row_height_in - (2 * row_corner_height)
col_center_width = col_width_in - (2 * col_corner_width)
row_step_height = row_height_in - row_overlap_height
col_step_width = col_width_in - col_overlap_width

pixel_value_dtype = imgs_prep.dtype
pixel_index_dtype = np.uint16
image_index_dtype = np.uint8

merged_shape = [(initial_shape[0] * row_step_height) + row_corner_height, (initial_shape[1] * col_step_width) + col_corner_width, 3]
merged_inner_height = merged_shape[0] - row_corner_height
merged_inner_width = merged_shape[1] - col_corner_width
source_inner_height = row_height_in - row_corner_height
source_inner_width = col_width_in - col_corner_width

print(merged_shape)
merged = np.ndarray(merged_shape, dtype=pixel_value_dtype)

# To desribe each region we know that there are
# -- P source images contributing content (1, 2 or 4)
# -- M occurences in each row
# -- N occurences in each column
# -- 1 destination image receiving content
# -- 2 coordinates giving (row, col) coordinates of the lower-left corner of that region in each source/dest
# -- We can always derive the upper right coordinate of the affected space because we have a separate shape
#    definition for each kind of overlap
# So for each of the region shape arrays that has an associated P of (1, 2, or 4), we need three futher arrays:
# -- [M,N,2] -- For the lower right coordinates of each region in the merged output
# -- [M,N,P] -- For identifying the sole source, left and right sources, lower and upper sources, or 
#               lower left, upper left, upper right, and lower right sources
# -- [M.N,P,2]  For each partcicipant identified, the lower left corner of the contributing region as (row, col).
# image, so the third dimension does not apply

# All 1x (unblended) shapes: Outside corners, central perimeter part of each row/col, middle section of each cell
corner_region = {
    "shape": [row_corner_height, col_corner_width, 3],
    "instances": [2, 2],
    "overlap": 1,
    "source_index": np.ndarray([2, 2, 1, 2], dtype=image_index_dtype),
    "merge_from": np.ndarray([2, 2, 1, 2], dtype=pixel_index_dtype),
    "merge_to": np.ndarray([2, 2, 2], dtype=pixel_index_dtype),
}
corner_region["source_index"] = [[[
    [x * (row_count - 1), y * (col_count - 1)]
    for y in range(0, 2)]
    for x in range(0, 2)]]
corner_region["merge_from"] = [[[
    [x * source_inner_height, y * source_inner_width]
    for y in range(0, 2)]
    for x in range(0, 2)]]
corner_region["merge_to"] =[[
    [x * merged_inner_height, y * merged_inner_width]
    for y in range(0, 2)]
    for x in range(0, 2)]
apply_region_spec(corner_region, imgs_prep, merged)
        
row_perimeter_region = {
    "shape": [row_center_height, col_corner_width, 3],
    "instances": [row_count, 2],
    "overlap": 1,
    "source_index": np.ndarray([row_count, 2, 1, 2], dtype=image_index_dtype),
    "merge_from": np.ndarray([row_count, 2, 1, 2], dtype=pixel_index_dtype),
    "merge_to": np.ndarray([row_count, 2, 2], dtype=pixel_index_dtype),
}
row_perimeter_region["source_index"] = [[[
    [x, y * (col_count - 1)]
    for y in range(0, 2)]
    for x in range(0, row_count)]]
row_perimeter_region["merge_from"] =[[[
    [row_corner_height, (y * source_inner_width)]
    for y in range(0, 2)]
    for x in range(0, row_count)]]
row_perimeter_region["merge_to"] =[[
    [row_corner_height + (x * row_step_height), (y * merged_inner_width)]
    for y in range(0, 2)]
    for x in range(0, row_count)]
apply_region_spec(row_perimeter_region, imgs_prep, merged)

col_perimeter_region = {
    "shape": [row_corner_height, col_center_width, 3],
    "instances": [2, col_count],
    "overlap": 1,
    "source_index": np.ndarray([2, col_count, 1, 2], dtype=image_index_dtype),
    "merge_from": np.ndarray([2, col_count, 1, 2], dtype=pixel_index_dtype),
    "merge_to": np.ndarray([2, col_count, 2], dtype=pixel_index_dtype),
}
col_perimeter_region["source_index"] = [[[
    [x * (row_count - 1), y]
    for y in range(0, col_count)]
    for x in range(0, 2)]]
col_perimeter_region["merge_from"] =[[[
    [x * source_inner_height, col_corner_width]
    for y in range(0, col_count)]
    for x in range(0, 2)]]
col_perimeter_region["merge_to"] =[[
    [x * merged_inner_height, col_corner_width + (y * col_step_width)]
    for y in range(0, col_count)]
    for x in range(0, 2)]
apply_region_spec(col_perimeter_region, imgs_prep, merged)

cell_center_region = {
    "shape": [row_center_height, col_center_width, 3],
    "instances": [row_count, col_count],
    "overlap": 1,
    "source_index": np.ndarray([row_count, col_count, 1, 2], dtype=image_index_dtype),
    "merge_from": np.ndarray([row_count, col_count, 1, 2], dtype=pixel_index_dtype),
    "merge_to": np.ndarray([row_count, col_count, 2], dtype=pixel_index_dtype),
}
cell_center_region["source_index"] = [[[
    [x, y]
    for y in range(0, col_count)]
    for x in range(0, row_count)]]
cell_center_region["merge_from"] = [[[
    [row_corner_height, col_corner_width]
    for y in range(0, col_count)]
    for x in range(0, row_count)]]
cell_center_region["merge_to"] = [[
    [row_corner_height + (x * row_step_height), col_corner_width + (y * col_step_width)]
    for y in range(0, col_count)]
    for x in range(0, row_count)]
apply_region_spec(cell_center_region, imgs_prep, merged)

# All 2x (single blend) shapes:
# -- Corner-sized overlaps between each pair of perimeter corners
# -- Central-strip sized overlap between neighbords in the same row or column
# -- Notice that if a perimeter cell has a strip overlap in the same row, its perimeter overlap is in
#    the same column, and vice-versa.
# -- Notice that the inside overlap shape depends on same-row or same-col, but all perimeter ovelaps
#    are the same shape, regardless of orientation.
# -- Notice for Source Index and Merge From:
#    -- The first index is the overlap count
#    -- The next indices are the pattern instance counts in X and Y
#    -- The last indices are the a pair of (x,y) coordinates for either 
#       a Source in the grid of sources or a pixel in the grid of a source
# -- Notice for Merge To, there is only one output, so we have one three
#    dimensions instead of four.
row_perimeter_overlap_region = {
    "shape": [row_overlap_height, col_overlap_width, 3],
    "instances": [row_count - 1, 2],
    "overlap": 2,
    "source_index": np.ndarray([2, row_count - 1, 2, 2], dtype=image_index_dtype),
    "merge_from": np.ndarray([2, row_count - 1, 2, 2], dtype=pixel_index_dtype),
    "merge_to": np.ndarray([row_count - 1, 2, 2], dtype=pixel_index_dtype),
}
row_perimeter_overlap_region["source_index"] = [
    [[
        [x, y * (col_count - 1)]
        for y in range(0, 2)]
        for x in range(0, row_count - 1)],
    [[
        [x, y * (col_count - 1)]
        for y in range(0, 2)]
        for x in range(1, row_count)],
]
row_perimeter_overlap_region["merge_from"] = [
    [[
       [row_step_height, (y * source_inner_width)]
       for y in range(0, 2)]
       for x in range(0, row_count - 1)],
    [[
       [0, (y * source_inner_width)]
       for y in range(0, 2)]
       for x in range(1, row_count)],
]
row_perimeter_overlap_region["merge_to"] = [[
    [(x * row_step_height), (y * merged_inner_width)]
    for y in range(0, 2)]
    for x in range(1, row_count)]
overlap_region_spec(row_perimeter_overlap_region, imgs_prep, "vertical", merged)

col_perimeter_overlap_region = {
    "shape": [row_overlap_height, col_overlap_width, 3],
    "instances": [2, col_count - 1],
    "overlap": 2,
    "source_index": np.ndarray([2, col_count - 1, 2, 2], dtype=image_index_dtype),
    "merge_from": np.ndarray([2, col_count - 1, 2, 2], dtype=pixel_index_dtype),
    "merge_to": np.ndarray([2, col_count - 1, 2], dtype=pixel_index_dtype),
}
col_perimeter_overlap_region["source_index"] = [
    [[
        [x * (row_count - 1), y]
        for y in range(0, col_count - 1)]
        for x in range(0, 2)],
    [[
        [x * (row_count - 1), y]
        for y in range(1, col_count)]
        for x in range(0, 2)],
]
col_perimeter_overlap_region["merge_from"] = [
    [
       [
           [(x * source_inner_height), col_step_width]
           for y in range(0, col_count - 1)
       ]
       for x in range(0, 2)
    ],
    [
       [
           [(x * source_inner_height), 0]
           for y in range(1, col_count)
       ]
       for x in range(0, 2)
    ],
]
col_perimeter_overlap_region["merge_to"] = [[
    [(x * merged_inner_height), (y * col_step_width)]
    for y in range(1, col_count)]
    for x in range(0, 2)]
overlap_region_spec(col_perimeter_overlap_region, imgs_prep, "horizontal", merged)

same_row_inside_overlap_region = {
    "shape": [row_center_height, col_overlap_width, 3],
    "instances": [row_count, col_count - 1],
    "overlap": 2,
    "source_index": np.ndarray([row_count, col_count - 1, 2, 2], dtype=image_index_dtype),
    "merge_from": np.ndarray([row_count, col_count - 1, 2, 2], dtype=pixel_index_dtype),
    "merge_to": np.ndarray([row_count, col_count - 1, 2], dtype=pixel_index_dtype),
}
same_row_inside_overlap_region["source_index"] = [
    [[
        [x, y]
        for y in range(0, col_count - 1)]
        for x in range(0, row_count)],
    [[
        [x, y]
        for y in range(1, col_count)]
        for x in range(0, row_count)],
]
same_row_inside_overlap_region["merge_from"] = [
    [
       [
           [row_overlap_height, col_step_width]
           for y in range(0, col_count - 1)
       ]
       for x in range(0, row_count)
    ],
    [
       [
           [row_overlap_height, 0]
           for y in range(1, col_count)
       ]
       for x in range(0, row_count)
    ],
]
same_row_inside_overlap_region["merge_to"] = [[
    [(x * row_step_height) + row_overlap_height, (y * col_step_width)]
    for y in range(1, col_count)]
    for x in range(0, row_count)]
overlap_region_spec(same_row_inside_overlap_region, imgs_prep, "horizontal", merged)

same_col_inside_overlap_region = {
    "shape": [row_overlap_height, col_center_width, 3],
    "instances": [row_count - 1, col_count],
    "overlap": 2,
    "source_index": np.ndarray([row_count - 1, col_count, 2, 2], dtype=image_index_dtype),
    "merge_from": np.ndarray([row_count - 1, col_count, 2, 2], dtype=pixel_index_dtype),
    "merge_to": np.ndarray([row_count - 1, col_count, 2], dtype=pixel_index_dtype),
}
same_col_inside_overlap_region["source_index"] = [
    [[
        [x, y]
        for y in range(0, col_count)]
        for x in range(0, row_count - 1)],
    [[
        [x, y]
        for y in range(0, col_count)]
        for x in range(1, row_count)],
]
same_col_inside_overlap_region["merge_from"] = [
    [
       [
           [row_step_height, col_overlap_width]
           for y in range(0, col_count)
       ]
       for x in range(0, row_count - 1)
    ],
    [
       [
           [0, col_overlap_width]
           for y in range(0, col_count)
       ]
       for x in range(1, row_count)
    ],
]
same_col_inside_overlap_region["merge_to"] = [[
    [(x * row_step_height), (y * col_step_width) + col_overlap_width]
    for y in range(0, col_count)]
    for x in range(1, row_count)]
overlap_region_spec(same_col_inside_overlap_region, imgs_prep, "vertical", merged)

# All 4x (double blend) shapes:
inner_4way_region = {
    "shape": [row_overlap_height, col_overlap_width, 3],
    "instances": [row_count - 1, col_count - 1],
    "overlap": 4,
    "source_index": np.ndarray([row_count - 1, col_count - 1, 4, 2], dtype=image_index_dtype),
    "merge_from": np.ndarray([row_count - 1, col_count - 1, 4, 2], dtype=pixel_index_dtype),
    "merge_to": np.ndarray([row_count - 1, col_count - 1, 2], dtype=pixel_index_dtype),
}
inner_4way_region["source_index"] = [
    [[
        [x, y]
        for y in range(0, col_count - 1)]
        for x in range(0, row_count - 1)],
    [[
        [x, y]
        for y in range(0, col_count - 1)]
        for x in range(1, row_count)],
    [[
        [x, y]
        for y in range(1, col_count)]
        for x in range(0, row_count - 1)],
    [[
        [x, y]
        for y in range(1, col_count)]
        for x in range(1, row_count)],
]
inner_4way_region["merge_from"] = [
    [
       [
           [row_step_height, col_step_width]
           for y in range(0, col_count - 1)
       ]
       for x in range(0, row_count - 1)
    ],
    [
       [
           [0, col_step_width]
           for y in range(0, col_count - 1)
       ]
       for x in range(1, row_count)
    ],
    [
       [
           [row_step_height, 0]
           for y in range(1, col_count)
       ]
       for x in range(0, row_count - 1)
    ],
    [
       [
           [0, 0]
           for y in range(1, col_count)
       ]
       for x in range(1, row_count)
    ],
]
inner_4way_region["merge_to"] = [[
    [(x * row_step_height), (y * col_step_width)]
    for y in range(1, col_count)]
    for x in range(1, row_count)]
quad_region_spec(inner_4way_region, imgs_prep, merged)

colorFixed = cv2.cvtColor(merged, cv2.COLOR_BGR2RGB)
imsave("output.pnga", colorFixed)

plt.figure(figsize=(3, 3))
plt.subplot(1, 1, 1)
plt.imshow(cv2.cvtColor(merged, cv2.COLOR_BGR2RGB))
plt.axis('off')
plt.show()

# Changing the values of alpha and beta 
# alpha = 0.5  
# beta = 1-alpha  # beta=0.5
# 
# blended_image = cv2.addWeighted(image1, alpha, image2, beta, 0)
# plt.figure(figsize=(15, 5))
# 
# plt.subplot(1, 3, 1)
# plt.imshow(cv2.cvtColor(image1, cv2.COLOR_BGR2RGB))
# plt.title('Image 1')
# plt.axis('off')
# 
# plt.subplot(1, 3, 2)
# plt.imshow(cv2.cvtColor(image2, cv2.COLOR_BGR2RGB))
# plt.title('Image 2')
# plt.axis('off')
# 
# plt.subplot(1, 3, 3)
# plt.imshow(cv2.cvtColor(blended_image, cv2.COLOR_BGR2RGB))
# plt.title('Blended Image')
# plt.axis('off')
# 
# plt.show()
