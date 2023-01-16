#!/usr/bin/env bash

cd quorum
go mod download

GIT_COMMIT=$(git rev-list -1 HEAD)
BIN_DIR="../quorum_bin"

declare -A os
os["windows"]="quorum_win.exe"
os["linux"]="quorum_linux"
os["darwin"]="quorum_darwin"


for GOOS in ${!os[@]}; do
    for GOARCH in amd64; do
        bin="${BIN_DIR}/${os[$GOOS]}"
        GOOS=$GOOS GOARCH=$GOARCH go build -v -o "$bin" -trimpath -ldflags "-X main.GitCommit=$GIT_COMMIT -s -w -buildid=" cmd/main.go
    done
done

GOOS="js" GOARCH="wasm" GO111MODULE="on" go build -v -o ../quorum_bin/lib.wasm -trimpath -ldflags "-X github.com/rumsystem/quorum/internal/pkg/utils.GitCommit=$GIT_COMMIT -s -w -buildid=" cmd/wasm/lib.go
