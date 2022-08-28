load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "build_bazel_rules_nodejs",
    sha256 = "6142e9586162b179fdd570a55e50d1332e7d9c030efd853453438d607569721d",
    urls = ["https://github.com/bazelbuild/rules_nodejs/releases/download/3.0.0/rules_nodejs-3.0.0.tar.gz"],
    # sha256 = "f10a3a12894fc3c9bf578ee5a5691769f6805c4be84359681a785a0c12e8d2b6",
    # urls = ["https://github.com/bazelbuild/rules_nodejs/releases/download/5.5.3/rules_nodejs-5.5.3.tar.gz"],
)

# load("@build_bazel_rules_nodejs//:repositories.bzl", "build_bazel_rules_nodejs_dependencies")
# build_bazel_rules_nodejs_dependencies()

http_archive(
    name = "rules_proto",
    sha256 = "e017528fd1c91c5a33f15493e3a398181a9e821a804eb7ff5acdd1d2d6c2b18d",
    strip_prefix = "rules_proto-4.0.0-3.20.0",
    urls = [
        "https://github.com/bazelbuild/rules_proto/archive/refs/tags/4.0.0-3.20.0.tar.gz",
    ],
)
http_archive(
    name = "rules_proto_grpc",
    sha256 = "507e38c8d95c7efa4f3b1c0595a8e8f139c885cb41a76cab7e20e4e67ae87731",
    strip_prefix = "rules_proto_grpc-4.1.1",
    urls = ["https://github.com/rules-proto-grpc/rules_proto_grpc/archive/4.1.1.tar.gz"],
)

load("@rules_proto//proto:repositories.bzl", "rules_proto_dependencies", "rules_proto_toolchains")
rules_proto_dependencies()
rules_proto_toolchains()

load("@rules_proto_grpc//:repositories.bzl", "rules_proto_grpc_toolchains", "rules_proto_grpc_repos")
rules_proto_grpc_toolchains()
rules_proto_grpc_repos()

load("@rules_proto_grpc//js:repositories.bzl", rules_proto_grpc_js_repos = "js_repos")
rules_proto_grpc_js_repos()


load("@build_bazel_rules_nodejs//:index.bzl", "node_repositories", "yarn_install")
node_repositories(
    package_json = [ "//function:package.json" ],
    node_version = "16.16.0",
    node_repositories = {
    "16.16.0-darwin_arm64": ("node-v16.16.0-darwin-arm64.tar.gz", "node-v16.16.0-darwin-arm64", "167721c2d72402e54adc0f8c87ca840796216c4d98946509d73221b771ad3e4c"),
    "16.16.0-darwin_amd64": ("node-v16.16.0-darwin-x64.tar.gz", "node-v16.16.0-darwin-x64", "982edd0fad364ad6e2d72161671544ab9399bd0ca8c726bde3cd07775c4c709a"),
    "16.16.0-linux_arm64": ("node-v16.16.0-linux-arm64.tar.xz", "node-v16.16.0-linux-arm64", "6cb8f1353480646c1cd8ab9911995e5591e1a97811f43ea4ab3e946a57e7c80e"),
    "16.16.0-linux_ppc64le": ("node-v16.16.0-linux-ppc64le.tar.xz", "node-v16.16.0-linux-ppc64le", "32c665437a17cb5ad273ed7abe1a5711935f2b86d36dce315b5655d524fbc041"),
    "16.16.0-linux_s390x": ("node-v16.16.0-linux-s390x.tar.xz", "node-v16.16.0-linux-s390x", "bd779749163d3b26d2b54fc6f9731fd6dba903c7b54caa40afbbb9476637cdff"),
    "16.16.0-linux_amd64": ("node-v16.16.0-linux-x64.tar.xz", "node-v16.16.0-linux-x64", "edcb6e9bb049ae365611aa209fc03c4bfc7e0295dbcc5b2f1e710ac70384a8ec"),
    "16.16.0-windows_amd64": ("node-v16.16.0-win-x64.zip", "node-v16.16.0-win-x64", "c657acc98af55018c8fd6113c7e08d67c8083af75ba0306f9561b0117abc39d4")
  },
  node_urls = [
    "https://nodejs.org/dist/v{version}/{filename}",
  ],
  yarn_repositories = {
    "1.22.19": ("yarn-v1.22.19.tar.gz", "yarn-v1.22.19", "732620bac8b1690d507274f025f3c6cfdc3627a84d9642e38a07452cc00e0f2e"),
  },
  yarn_version = "1.22.19",
  yarn_urls = [
    "https://github.com/yarnpkg/yarn/releases/download/v{version}/{filename}",
  ],
)
yarn_install(
    name = "npm",
    package_json = "//function:package.json",
    yarn_lock = "//function:yarn.lock",
)


http_archive(
    name = "rules_nodejs",
    sha256 = "5aef09ed3279aa01d5c928e3beb248f9ad32dde6aafe6373a8c994c3ce643064",
    urls = ["https://github.com/bazelbuild/rules_nodejs/releases/download/5.5.3/rules_nodejs-core-5.5.3.tar.gz"],
)


http_archive(
    name = "rules_typescript_proto",
    # TODO: Update these values to the latest version
    sha256 = "aac6dec2c8d55da2b2c2689b7a2afe44b691555cab32e2eaa2bdd29627d950e9",
    strip_prefix = "rules_typescript_proto-1.0.1",
    urls = [
        "https://github.com/Dig-Doug/rules_typescript_proto/archive/1.0.1.tar.gz",
    ],
)

load("@rules_typescript_proto//:index.bzl", "rules_typescript_proto_dependencies")
rules_typescript_proto_dependencies()
