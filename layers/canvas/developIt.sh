#!/bin/sh

thisDir="$(dirname "$(realpath "${0}")")"
docker run -i -t --rm --volume "${thisDir}:/tmp/source:ro,delegated" public.ecr.aws/sam/build-nodejs14.x:latest-x86_64
