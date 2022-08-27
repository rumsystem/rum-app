#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
cd ..

rm -rf quorum
mkdir -p quorum
cd quorum
git clone --depth=1 git@github.com:rumsystem/quorum.git .
go mod download

GIT_COMMIT=$(git rev-list -1 HEAD)
export GOOS="js"
export GOARCH="wasm"
export GO111MODULE="on"

go build -v -o ../quorum_bin/lib.wasm -trimpath -ldflags "-X github.com/rumsystem/quorum/internal/pkg/utils.GitCommit=$GIT_COMMIT -s -w -buildid=" cmd/wasm/lib.go
