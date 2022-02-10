cd quorum
go mod download
export GOARCH="amd64"

export GOOS="windows"
export GIT_COMMIT=$(git rev-list -1 HEAD) && go build -v -o ../quorum_bin/quorum_win.exe -trimpath -ldflags "-X main.GitCommit=$GIT_COMMIT -s -w -buildid=" cmd/main.go

export GOOS="linux"
export GIT_COMMIT=$(git rev-list -1 HEAD) && go build -v -o ../quorum_bin/quorum_linux -trimpath -ldflags "-X main.GitCommit=$GIT_COMMIT -s -w -buildid=" cmd/main.go

export GOOS="darwin"
export GIT_COMMIT=$(git rev-list -1 HEAD) && go build -v -o ../quorum_bin/quorum_darwin -trimpath -ldflags "-X main.GitCommit=$GIT_COMMIT -s -w -buildid=" cmd/main.go
