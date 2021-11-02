cd quorum
go mod download
export goarch=386

export goos=windows
go build -v -o ../quorum_bin/quorum_win.exe -trimpath -ldflags "-s -w -buildid=" cmd/main.go

export goos=linux
go build -v -o ../quorum_bin/quorum_linux -trimpath -ldflags "-s -w -buildid=" cmd/main.go

export goos=darwin
go build -v -o ../quorum_bin/quorum_darwin -trimpath -ldflags "-s -w -buildid=" cmd/main.go
