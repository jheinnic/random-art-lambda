# Copyright 2019 gRPC authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""An example of multiprocessing concurrency with gRPC."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import argparse
import atexit
import base64
import logging
import sys
import multiprocessing
import urllib.parse
from typing import Tuple

import grpc
import requests

import v1.signed_image_uploads_pb2_grpc
from v1.signed_image_uploads_pb2 import CreateSignedUploadSingleRequest, OptionalUploadFeature, \
    SignedUploadSingleReply, FlaggedOptionalFeature

_PROCESS_COUNT = multiprocessing.cpu_count()
_MAXIMUM_CANDIDATE = 10000

# Each worker process initializes a single channel after forking.
# It's regrettable, but to ensure that each subprocess only has to instantiate
# a single channel to be reused across all RPCs, we use globals.
_worker_channel_singleton: grpc.Channel
_worker_stub_singleton: v1.signed_image_uploads_pb2_grpc.ImageUploadSigningServiceStub

_LOGGER = logging.getLogger(__name__)


def _shutdown_worker():
    _LOGGER.info('Shutting worker process down.')
    if _worker_channel_singleton is not None:
        _worker_channel_singleton.close()


def _initialize_worker(server_address):
    global _worker_channel_singleton  # pylint: disable=global-statement
    global _worker_stub_singleton  # pylint: disable=global-statement
    _LOGGER.info('Initializing worker process.')
    _worker_channel_singleton = grpc.insecure_channel(server_address)
    _worker_stub_singleton = v1.signed_image_uploads_pb2_grpc.ImageUploadSigningServiceStub(
        _worker_channel_singleton)
    atexit.register(_shutdown_worker)


def _add_optional_feature_flag(
        request: CreateSignedUploadSingleRequest, index: int, flag: FlaggedOptionalFeature
) -> None:
    option = OptionalUploadFeature()
    option.flag = flag
    request.options.insert(index, option)


def _run_worker_query(_dummy_var) -> Tuple[int, bytes]:
    print(f"Calling API on {_dummy_var}")
    request: CreateSignedUploadSingleRequest = CreateSignedUploadSingleRequest()
    _add_optional_feature_flag(request, 0, FlaggedOptionalFeature.COLOR_ANALYSIS)
    _add_optional_feature_flag(request, 1, FlaggedOptionalFeature.QUALITY_ANALYSIS)
    _add_optional_feature_flag(request, 2, FlaggedOptionalFeature.IMAGE_METADATA)
    try:
        result: SignedUploadSingleReply = _worker_stub_singleton.createSignedUpload(request)
        print(f"{result.uploadUrl} {result.publicId} {result.queryString} {result.signature}")
    except Exception as e:
        print(f"{e}")
        raise e
    with open("../roister shill.png", "rb") as fh:
        data_uri = "data:image/png;base64," + base64.encodebytes(
            fh.read()
        ).replace(b'\n', b'') \
            .decode('utf8')
    params = urllib.parse.parse_qs(result.queryString)
    params["file"] = [data_uri]
    http_result = requests.post(result.uploadUrl, data=params)
    print(f"Result code: {http_result.status_code}, message: {http_result.content}")
    return result


def _get_one_uuid(server_address) -> SignedUploadSingleReply:
    worker_pool = multiprocessing.Pool(processes=_PROCESS_COUNT,
                                       initializer=_initialize_worker,
                                       initargs=(server_address,))
    result = worker_pool.apply(_run_worker_query)
    print("Worker returning %s", str(result))
    return result


def main():
    msg = "description"
    parser = argparse.ArgumentParser(description=msg)
    parser.add_argument('server_address',
                        help='The address of the server (e.g. localhost:50051)')
    args = parser.parse_args()
    print(_get_one_uuid(args.server_address))


if __name__ == '__main__':
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter('[PID %(process)d] %(message)s')
    handler.setFormatter(formatter)
    _LOGGER.addHandler(handler)
    _LOGGER.setLevel(logging.INFO)
    main()
