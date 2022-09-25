#!/bin/sh

BUILD_DIR="${1}"

# Patch yum to prevent rpmdb checksum error as per https://github.com/CentOS/sig-cloud-instance-images/issues/15
yum clean all && yum update -y && yum install -y yum-plugin-ovl

# Install dependencies
yum groupinstall -y "Development Tools" && \
yum install -y gcc-c++ bzip2-devel jq && \
yum install -y pixman-devel cairo cairo-devel pango pango-devel giflib giflib-devel dejavu-fonts-common dejavu-sans-fonts dejavu-sans-mono-fonts dejavu-serif-fonts libjpeg-devel gdk-pixbuf2 gdk-pixbuf2-devel librsvg2 librsvg2-devel

# Cleanup!
yum clean all && rm -rf /var/cache/yum

# Earlier apt-based commmand.  No longer needed.
# apt install -y libpixman-1-dev libcairo2 libcairo2-dev libcairo2-doc libpango1.0-0 libpango1.0-dev libpango1.0-doc libgif-dev ttf-dejavu-core ttf-dejavu-extra ttf-dejavu ttf-bitstream-vera
