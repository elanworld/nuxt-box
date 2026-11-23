#!/usr/bin/env bash
set -euo pipefail
: "${DOCKER_HUB_USERNAME:?set DOCKER_HUB_USERNAME}"
TAG="${1:-latest}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
docker build -f Dockerfile.node -t "${DOCKER_HUB_USERNAME}/nuxt-box-node:${TAG}" -t "${DOCKER_HUB_USERNAME}/nuxt-box:${TAG}" .
docker build -f Dockerfile.worker-sqlite -t "${DOCKER_HUB_USERNAME}/nuxt-box-worker-sqlite:${TAG}" .
docker push "${DOCKER_HUB_USERNAME}/nuxt-box-node:${TAG}"
docker push "${DOCKER_HUB_USERNAME}/nuxt-box:${TAG}"
docker push "${DOCKER_HUB_USERNAME}/nuxt-box-worker-sqlite:${TAG}"
docker inspect "${DOCKER_HUB_USERNAME}/nuxt-box-node:${TAG}" --format '{{index .RepoDigests 0}}'