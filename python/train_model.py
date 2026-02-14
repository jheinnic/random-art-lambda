from skimage.feature.texture import multiblock_lbp 
from skimage.transform import integral_image
from skimage.color import rgb2hsv 
from skimage.io import imread

from sklearn.model_selection import GridSearchCV
from sklearn.model_selection import StratifiedKFold
from sklearn import svm 

from scipy.stats import entropy

from itertools import chain
import pandas as pd
import numpy as np
import pickle, sys, os
    

# Define the ranges for each HSV channel (all are [0, 1] for skimage)
# Used for color diversity scoring
bins = 8
ranges = [ (0, 1), (0, 1), (0, 1) ]
all_hsv_pixels = {}

def score_color_diversity(hsv_pixels):
    hist, _ = np.histogramdd(hsv_pixels, bins=bins, range=ranges)
    hist_flat = hist.flatten()
    hist_prob = hist_flat / np.sum(hist_flat)
    hist_prob = hist_prob[hist_prob > 0]
    return entropy(hist_prob, base=2)

RANDOM_SEED=89783672

lin_nums = np.linspace(0, 1024, 65)
sparse_pick = lin_nums[slice(4, 1024, 8)]
feature_indices = sparse_pick.astype(np.int32)

feature_coords = np.array([
    [(x, y) for y in sparse_pick] for x in sparse_pick], dtype= np.int16)
feature_coords = feature_coords.reshape((len(sparse_pick)*len(sparse_pick), 2))
    
pixel_count = (feature_indices[1] - feature_indices[0]) // 14
channels = range(3)

data_root = sys.argv[1]
source_dirs = sys.argv[2:]

sources = []
for label_dir in source_dirs:
    label_source = [
        { "file": data_root + "/" + label_dir + "/" + file, "label": label_dir }
            for file in os.listdir(data_root + "/" + label_dir)
            if file.endswith(".png")]
    sources.extend(label_source[:200])
    all_hsv_pixels[label_dir] = []

print("Loading test and train data sets")

for source in sources:
    image = imread(source["file"])

    # Create a 3D histogram of the HSV pixel values,
    # Reshape and flatten the image for histogram calculation
    # Normalize that for a probability distribution.
    # Prune impossible valuse (probability <= 0), then calculate
    # entropy of the result and retain the score.
    hsv_image = rgb2hsv(image)
    hsv_pixels = hsv_image.reshape((-1, 3))
    all_hsv_pixels[source["label"]].append(hsv_pixels)
    source["diversity"] = score_color_diversity(hsv_pixels)

    image = image.transpose(2,0,1)
    source["image"] = [integral_image(image[c]) for c in channels]

for label_dir in source_dirs:
    label_hsv_pixels = np.vstack(all_hsv_pixels[label_dir])
    all_hsv_pixels[label_dir] = {
        "population": score_color_diversity(label_hsv_pixels),
        "individuals": [source["diversity"] for source in sources if source["label"] == label_dir]
    }
    
# Save the color diversity scores to a file
print("Color Diversities by Label")
with open('color_diversity_scores.pkl', 'wb') as file:
    pickle.dump(all_hsv_pixels, file)
print(all_hsv_pixels)
all_hsv_pixels = None

print("Reducing loaded data")
for source in sources:
    image = source["image"]
    del(source["image"])
    source["mblbp"] = np.array([
        [
            multiblock_lbp(image[c], x, y, pixel_count, pixel_count)
            for (x, y) in feature_coords
        ] for c in channels
    ]).ravel()

data = [x["mblbp"] for x in sources]
targets = [x["label"] for x in sources]

skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_SEED)
parameters = {'kernel':('linear', 'rbf'), 'C':[0.1, 1, 2, 5, 10]}
svc = svm.SVC()

print("Training model")
clf = GridSearchCV(svc, parameters, cv=skf)
clf.fit(data, targets)

df = pd.DataFrame(clf.cv_results_)
print(df.to_json())

# The best model is stored in the best_estimator_ attribute
best_model = clf.best_estimator_

# Save the best model to a file
with open('best_svm_model.pkl', 'wb') as file:
    pickle.dump(best_model, file)

# Repeat, alt CV
print("Model saved")

print("Training alternate model")
svc2 = svm.SVC()
clf2 = GridSearchCV(svc, parameters)
clf2.fit(data, targets)
df2 = pd.DataFrame(clf2.cv_results_)
print(df2.to_json())

# Save the best model to a file
best_model2 = clf2.best_estimator_
with open('best_alt_svm_model.pkl', 'wb') as file:
    pickle.dump(best_model2, file)
