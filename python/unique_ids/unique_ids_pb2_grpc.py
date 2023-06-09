# Generated by the gRPC Python protocol compiler plugin. DO NOT EDIT!
"""Client and server classes corresponding to protobuf-defined services."""
import grpc

import unique_ids_pb2 as unique__ids__pb2


class ImageUploadSigningServiceStub(object):
    """Missing associated documentation comment in .proto file."""

    def __init__(self, channel):
        """Constructor.

        Args:
            channel: A grpc.Channel.
        """
        self.createOneUniqueId = channel.unary_unary(
                '/unique_identity.ImageUploadSigningService/createOneUniqueId',
                request_serializer=unique__ids__pb2.CreateOneUniqueIdRequest.SerializeToString,
                response_deserializer=unique__ids__pb2.UniqueIdReply.FromString,
                )
        self.createUniqueIdBatch = channel.unary_stream(
                '/unique_identity.ImageUploadSigningService/createUniqueIdBatch',
                request_serializer=unique__ids__pb2.CreateUniqueIdBatchRequest.SerializeToString,
                response_deserializer=unique__ids__pb2.UniqueIdReply.FromString,
                )


class ImageUploadSigningServiceServicer(object):
    """Missing associated documentation comment in .proto file."""

    def createOneUniqueId(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def createUniqueIdBatch(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')


def add_ImageUploadSigningServiceServicer_to_server(servicer, server):
    rpc_method_handlers = {
            'createOneUniqueId': grpc.unary_unary_rpc_method_handler(
                    servicer.createOneUniqueId,
                    request_deserializer=unique__ids__pb2.CreateOneUniqueIdRequest.FromString,
                    response_serializer=unique__ids__pb2.UniqueIdReply.SerializeToString,
            ),
            'createUniqueIdBatch': grpc.unary_stream_rpc_method_handler(
                    servicer.createUniqueIdBatch,
                    request_deserializer=unique__ids__pb2.CreateUniqueIdBatchRequest.FromString,
                    response_serializer=unique__ids__pb2.UniqueIdReply.SerializeToString,
            ),
    }
    generic_handler = grpc.method_handlers_generic_handler(
            'unique_identity.ImageUploadSigningService', rpc_method_handlers)
    server.add_generic_rpc_handlers((generic_handler,))


 # This class is part of an EXPERIMENTAL API.
class ImageUploadSigningService(object):
    """Missing associated documentation comment in .proto file."""

    @staticmethod
    def createOneUniqueId(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(request, target, '/unique_identity.ImageUploadSigningService/createOneUniqueId',
            unique__ids__pb2.CreateOneUniqueIdRequest.SerializeToString,
            unique__ids__pb2.UniqueIdReply.FromString,
            options, channel_credentials,
            insecure, call_credentials, compression, wait_for_ready, timeout, metadata)

    @staticmethod
    def createUniqueIdBatch(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_stream(request, target, '/unique_identity.ImageUploadSigningService/createUniqueIdBatch',
            unique__ids__pb2.CreateUniqueIdBatchRequest.SerializeToString,
            unique__ids__pb2.UniqueIdReply.FromString,
            options, channel_credentials,
            insecure, call_credentials, compression, wait_for_ready, timeout, metadata)
