# gRPC Bazel BUILD file.
#
# Copyright 2019 The gRPC authors.
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

load("@rules_proto//proto:defs.bzl", "proto_library")
load("//bazel:python_rules.bzl", "py_grpc_library", "py_proto_library")

proto_library(
    name = "v1/signed_image_uploads_proto",
    srcs = ["v1/signed_image_uploads.proto"],
)

py_proto_library(
    name = "v1/signed_image_uploads_proto_pb2",
    deps = [":v1/signed_image_uploads_proto"],
)

py_grpc_library(
    name = "v1/signed_image_uploads_proto_pb2_grpc",
    srcs = [":v1/signed_image_uploads_proto"],
    deps = [":v1/signed_image_uploads_proto_pb2"],
)

py_binary(
    name = "client",
    testonly = 1,
    srcs = ["client.py"],
    imports = ["."],
    python_version = "PY3",
    srcs_version = "PY3",
    deps = [
        ":v1/signed_image_uploads_proto_pb2",
        ":v1/signed_image_uploads_proto_pb2_grpc",
        "//src/python/grpcio/grpc:grpcio",
    ],
)

py_binary(
    name = "server",
    testonly = 1,
    srcs = ["server.py"],
    imports = ["."],
    python_version = "PY3",
    srcs_version = "PY3",
    deps = [
        "//src/python/grpcio/grpc:grpcio",
        ":v1/signed_image_uploads_proto_pb2",
        ":v1/signed_image_uploads_proto_pb2_grpc",
    ] + select({
        "//conditions:default": ["@futures//:futures"],
        "//:python3": [],
    }),
)

py_test(
    name = "test/_example_test",
    size = "small",
    srcs = ["test/_example_test.py"],
    data = [
        ":client",
        ":server",
    ],
    python_version = "PY3",
)
