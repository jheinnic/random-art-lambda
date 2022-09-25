from datetime import datetime
from typing import Iterator, Dict
from math import ceil
import os

import dotenv
import cloudinary
from cloudinary.utils import api_sign_request, urlencode, cloudinary_api_url

from typez import IPublicIdHelper, IUploadHelper, UploadOptions, AutoTagging, SignedUpload


class UploadHelper(IUploadHelper):
    def __init__(self, public_id_helper: IPublicIdHelper):
        dotenv.load_dotenv()
        # Cloudinary settings using python code.  Must run before cloudinary is used.
        self._cloudinary_api_key = os.environ['CLOUDINARY_API_KEY']
        self._cloudinary_api_secret = os.environ['CLOUDINARY_API_SECRET']
        cloudinary.config(
            cloud_name=os.environ['CLOUDINARY_CLOUD_NAME'],
            api_key=self._cloudinary_api_key,
            api_secret=self._cloudinary_api_secret
        )
        self._public_id_helper = public_id_helper

    def sign_upload(self, options: UploadOptions) -> SignedUpload:
        params = self._parse_options(options)
        return self._allocate_and_sign(params)

    def sign_upload_batch(self, options: UploadOptions, batch_size: int) -> Iterator[SignedUpload]:
        params = self._parse_options(options)
        for ii in range(0, batch_size):
            yield self._allocate_and_sign(params.copy())

    @classmethod
    def _parse_auto_tag_feature(cls, req_dict: Dict, feature: AutoTagging):
        tag_vendors = list()
        if feature.use_google:
            tag_vendors.append("google_tagging")
        if feature.use_imagga:
            tag_vendors.append("imagga_tagging")
        if feature.use_aws_rek:
            tag_vendors.append("aws_rek_tagging")
        if len(tag_vendors) > 0 and feature.threshold > 0:
            req_dict["categorization"] = ",".join(tag_vendors)
            req_dict["auto_tagging"] = feature.threshold

    def _parse_options(self, options: UploadOptions) -> Dict:
        params: Dict = dict(
            type="upload",
            format="png",
            phash=True,
            exif=True,
            colors=options.color_analysis,
            image_metadata=options.image_metadata,
            quality_analysis=options.quality_analysis,
        )
        if options.auto_tagging is not None:
            self._parse_auto_tag_feature(params, options.auto_tagging)
        return params

    def _allocate_and_sign(self, params: Dict):
        public_id = self._public_id_helper.get_new_id()
        params["public_id"] = public_id
        params["timestamp"] = ceil(datetime.now().timestamp())
        signature = api_sign_request(params, self._cloudinary_api_secret)
        params["signature"] = signature
        params["api_key"] = self._cloudinary_api_key
        params["resource_type"] = "image"
        return SignedUpload(
            public_id=public_id,
            query_string=urlencode(params),
            upload_url=cloudinary_api_url(),
        )
