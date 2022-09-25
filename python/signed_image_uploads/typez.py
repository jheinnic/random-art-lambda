import abc
from typing import List, Optional, Tuple, Iterator
from dataclasses import dataclass
#
# if TYPE_CHECKING:
#     from v1.signed_image_uploads_pb2 import CreateSignedUploadSingleRequest as _CreateSignedUploadSingleRequest, \
#         CreateSignedUploadBatchRequest as _CreateSignedUploadBachRequest, \
#         CreateSignedUploadCursorRequest as _CreateSignedUploadCursorRequest, \
#         SignedUploadSingleReply as _SignedUploadSingleReply, SignedUploadBatchReply as _SignedUploadBatchReply, \
#         SignedUploadCursorReply as _SignedUploadCursorReply
# else:
#     class _CreateSignedUploadSingleRequest:
#         ...
#
#
#     class _CreateSignedUploadBatchRequest:
#         ...
#
#
#     class _CreateSignedUploadCursorRequest:
#         ...
#
#
#     class _SignedUploadSingleReply:
#         ...
#
#
#     class _SignedUploadBatchReply:
#         ...
#
#
#     class _SignedUploadCursorReply:
#         ...


@dataclass(frozen=True)
class AutoTagging:
    threshold: int = -1
    use_google: bool = False
    use_imagga: bool = False
    use_aws_rek: bool = False


@dataclass(frozen=True)
class UploadOptions:
    quality_analysis: bool = False
    color_analysis: bool = False
    image_metadata: bool = False
    auto_tagging: Optional[AutoTagging] = None


@dataclass(frozen=True)
class SignedUpload:
    public_id: str = None
    query_string: str = None
    upload_url: str = None
    signature: str = None;


class IUploadHelper(abc.ABC):
    @abc.abstractmethod
    def sign_upload(self, options: UploadOptions) -> SignedUpload:
        pass

    @abc.abstractmethod
    def sign_upload_batch(self, options: UploadOptions, batch_size: int) -> Iterator[SignedUpload]:
        pass

    # @abc.abstractmethod
    # def sign_upload_cursor(
    #     self, options: UploadOptions, batch_size: int, fetch_size: int
    # ) -> Tuple[str, List[SignedUpload]]:
    #     pass
    #
    # @abc.abstractmethod
    # def advance_upload_cursor( self, cursor_token: str) -> Tuple[str, List[SignedUpload]]:
    #     pass


class IPublicIdHelper(abc.ABC):
    @abc.abstractmethod
    def get_new_id(self, is_series: bool = False) -> str:
        pass

    @abc.abstractmethod
    def get_next_id(self, last_allocation: str) -> str:
        pass
