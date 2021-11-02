cd quorum
go mod download
export GOARCH="amd64"

export GOOS="windows"
go build -v -o ../quorum_bin/quorum_win.exe -trimpath -ldflags "-s -w -buildid=" cmd/main.go

export GOOS="linux"
go build -v -o ../quorum_bin/quorum_linux -trimpath -ldflags "-s -w -buildid=" cmd/main.go

export GOOS="darwin"
go build -v -o ../quorum_bin/quorum_darwin -trimpath -ldflags "-s -w -buildid=" cmd/main.go
