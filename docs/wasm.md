## Build for Browser

You would need to have [`golang`](https://go.dev/) installed to build the wasm file.
**golang verion requirements check out [https://github.com/rumsystem/quorum](https://github.com/rumsystem/quorum)**

```sh
yarn
./scripts/build_wasm.sh # build wasm fild
yarn build:browser # build the browser bundle
```

Outputs will be under src/dist. Serve this folder with a static server to open the app.

**Attention: The server should use `http` rather than `https`, that's because when connecting to other peers, it would need to establish a `ws://` connection to it, due to browser security policies, it's not possible to open a non tls connection under a `https` domain.**
