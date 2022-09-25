import os
import base64
import dotenv
import requests
import cloudinary

from math import ceil
from datetime import datetime
from urllib.parse import parse_qs
from cloudinary.utils import api_sign_request, cloudinary_api_url, urlencode, build_upload_params

dotenv.load_dotenv()

_cloudinary_cloud_name = os.environ['CLOUDINARY_CLOUD_NAME']
_cloudinary_api_key = os.environ['CLOUDINARY_API_KEY']
_cloudinary_api_secret = os.environ["CLOUDINARY_API_SECRET"]
cloudinary = cloudinary.config(
    cloud_name=_cloudinary_cloud_name,
    api_key=_cloudinary_api_key,
    api_secret=_cloudinary_api_secret,
)


params = dict(
    public_id="test/a/fook",
    overwrite=True,
    type="upload",
    format="png",
    exif=True,
    phash=True,
    colors=True,
    image_metadata=True,
    quality_analysis=True,
)
params["timestamp"] = ceil(datetime.now().timestamp())
params_to_sign = params.copy()
signature = api_sign_request(params, _cloudinary_api_secret)
print(params)
print(params_to_sign)
print(signature)
print(_cloudinary_api_secret)
print(urlencode(params_to_sign))
params["signature"] = signature
params["api_key"] = _cloudinary_api_key
params["resource_type"] = "image"
query_string = urlencode(params)
upload_url = cloudinary_api_url()
print(params)
print(query_string)
print(upload_url)
params_out = parse_qs(query_string)
print(params_out)
fh = open('/Users/jheinnic/Documents/randomArt3/nuggi/gaccuujdo_nuggi.png', 'rb')
params_out["file"] = "data:image/png;base64," + base64.encodebytes(
    fh.read()
).replace(b'\n', b'') \
.decode('utf8')
fh.close()
result = requests.post(upload_url, data=params_out)
print(result)
print(result.content)
