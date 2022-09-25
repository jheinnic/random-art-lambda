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
from collections import Iterator
from concurrent import futures
from typing import Union, Dict
import multiprocessing
import contextlib
import datetime
import logging
import socket
import time
import sys

import grpc

from typez import IUploadHelper, UploadOptions, AutoTagging, SignedUpload
from upload_helper import UploadHelper
import v1.signed_image_uploads_pb2_grpc
from v1.signed_image_uploads_pb2 import CreateSignedUploadSingleRequest, CreateSignedUploadBatchRequest,\
    SignedUploadSingleReply, SignedUploadBatchReply, FlaggedOptionalFeature, OptionalUploadFeature, \
    AutoTaggingOptionalFeature

_LOGGER = logging.getLogger(__name__)

_ONE_DAY = datetime.timedelta(days=1)
_PROCESS_COUNT = 3 # multiprocessing.cpu_count()
_THREAD_CONCURRENCY = multiprocessing.cpu_count()


class ImageUploadSigningService(v1.signed_image_uploads_pb2_grpc.ImageUploadSigningService):
    def __init__(self, upload_helper: IUploadHelper):
        self._upload_helper = upload_helper

    def createSignedUpload(self, request: CreateSignedUploadSingleRequest, context) -> SignedUploadSingleReply:
        _LOGGER.info('Processing upload request')
        result: SignedUpload = self._upload_helper.sign_upload(
            self._parse_features(request)
        )
        reply = SignedUploadSingleReply()
        reply.publicId = result.public_id
        reply.queryString = result.query_string
        reply.uploadUrl = result.upload_url
        return reply

    def createSignedUploadBatch(self, request: CreateSignedUploadBatchRequest, context
                                ) -> Iterator[SignedUploadBatchReply]:
        _LOGGER.info('Processing batch upload request')
        for reply in self._upload_helper.sign_upload_batch(request, context):
            result = self._upload_helper.sign_upload(
                self._parse_features(request)
            )
            reply = SignedUploadSingleReply()
            reply.publicId = result.public_id
            reply.queryString = result.query_string
            reply.uploadUrl = result.upload_url
            yield reply
        return

    FLAG_TO_DICT_KEY = {
        FlaggedOptionalFeature.COLOR_ANALYSIS: "color_analysis",
        FlaggedOptionalFeature.QUALITY_ANALYSIS: "quality_analysis",
        FlaggedOptionalFeature.IMAGE_METADATA: "image_metadata"
    }

    @classmethod
    def _parse_flagged_feature(cls, req_dict: Dict, feature: OptionalUploadFeature) -> None:
        key: str = cls.FLAG_TO_DICT_KEY[feature.flag]
        req_dict[key] = True

    @classmethod
    def _parse_auto_tag_feature(cls, req_dict: Dict, feature: OptionalUploadFeature) -> None:
        auto_tag: AutoTaggingOptionalFeature = feature.autoTag
        req_dict["auto_tagging"] = AutoTagging(
            use_google=auto_tag.googleTagging,
            use_imagga=auto_tag.imaggaTagging,
            use_aws_rek=auto_tag.awsRekTagging,
            threshold=auto_tag.autoTagThreshold,
        )

    OPTIONAL_HANDLERS = {
        "flag": _parse_flagged_feature,
        "autoTag": _parse_auto_tag_feature,
    }

    def _parse_features(
        self, _proto_msg: Union[CreateSignedUploadSingleRequest, CreateSignedUploadBatchRequest]
    ) -> UploadOptions:
        request_dict = dict(
            color_analysis=False,
            quality_analysis=False,
            image_metadata=False,
            auto_tagging=None,
        )
        for feature in _proto_msg.options:
            which_one = feature.WhichOneof('featureKind')
            self.OPTIONAL_HANDLERS[which_one](request_dict, feature)
        return UploadOptions(
            color_analysis=request_dict["color_analysis"],
            quality_analysis=request_dict["quality_analysis"],
            image_metadata=request_dict["image_metadata"],
            auto_tagging=request_dict["auto_tagging"],
        )


def _wait_forever(server):
    try:
        while True:
            time.sleep(_ONE_DAY.total_seconds())
    except KeyboardInterrupt:
        server.stop(None)


def _run_server(bind_address):
    """Start a server in a subprocess."""
    _LOGGER.info('Starting new server.')
    options = (('grpc.so_reuseport', 1),)

    public_id_helper = PublicIdHelper()
    upload_helper = UploadHelper(public_id_helper)
    server = grpc.server(
        futures.ThreadPoolExecutor(max_workers=_THREAD_CONCURRENCY),
        options=options)
    v1.signed_image_uploads_pb2_grpc.add_ImageUploadSigningServiceServicer_to_server(
        ImageUploadSigningService(upload_helper), server)
    server.add_insecure_port(bind_address)
    server.start()
    _wait_forever(server)


@contextlib.contextmanager
def _reserve_port():
    """Find and reserve a port for all subprocesses to use."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)
    if sock.getsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT) == 0:
        raise RuntimeError("Failed to set SO_REUSEPORT.")
    sock.bind(('192.168.5.4', 0))
    try:
        yield sock.getsockname()[1]
    finally:
        sock.close()


def main():
    with _reserve_port() as port:
        bind_address = '192.168.5.4:{}'.format(port)
        _LOGGER.info("Binding to '%s'", bind_address)
        sys.stdout.flush()
        workers = []
        for _ in range(_PROCESS_COUNT):
            # NOTE: It is imperative that the worker subprocesses be forked before
            # any gRPC servers start up. See
            # https://github.com/grpc/grpc/issues/16001 for more details.
            worker = multiprocessing.Process(target=_run_server,
                                             args=(bind_address,))
            worker.start()
            workers.append(worker)
        for worker in workers:
            worker.join()


if __name__ == '__main__':
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter('[PID %(process)d] %(message)s')
    handler.setFormatter(formatter)
    _LOGGER.addHandler(handler)
    _LOGGER.setLevel(logging.INFO)
    main()
