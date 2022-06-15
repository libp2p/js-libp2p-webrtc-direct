# @libp2p/webrtc-direct <!-- omit in toc -->

[![libp2p.io](https://img.shields.io/badge/project-libp2p-yellow.svg?style=flat-square)](http://libp2p.io/)
[![IRC](https://img.shields.io/badge/freenode-%23libp2p-yellow.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23libp2p)
[![Discuss](https://img.shields.io/discourse/https/discuss.libp2p.io/posts.svg?style=flat-square)](https://discuss.libp2p.io)
[![codecov](https://img.shields.io/codecov/c/github/libp2p/js-libp2p-webrtc-direct.svg?style=flat-square)](https://codecov.io/gh/libp2p/js-libp2p-webrtc-direct)
[![CI](https://img.shields.io/github/workflow/status/libp2p/js-libp2p-interfaces/test%20&%20maybe%20release/master?style=flat-square)](https://github.com/libp2p/js-libp2p-webrtc-direct/actions/workflows/js-test-and-release.yml)

> Dial using WebRTC without the need to set up any Signalling Rendezvous Point!

## Table of contents <!-- omit in toc -->

- [Install](#install)
- [Usage](#usage)
- [API](#api)
  - [Transport](#transport)
  - [Connection](#connection)
- [Contribute](#contribute)
- [License](#license)
- [Contribution](#contribution)

## Install

```console
$ npm i @libp2p/webrtc-direct
```

![](https://raw.githubusercontent.com/libp2p/js-libp2p-interfaces/master/packages/libp2p-interfaces/src/connection/img/badge.png)
![](https://raw.githubusercontent.com/libp2p/js-libp2p-interfaces/master/packages/libp2p-interfaces/src/transport/img/badge.png)

**NOTE:** To run build scripts `node-pre-gyp` is required. You can install it by running `npm install -g node-pre-gyp`.

## Usage

```js
import { WebRTCDirect } from '@libp2p/webrtc-direct'
import { Multiaddr } from '@multiformats/multiaddr'
import { pipe } from 'it-pipe'
import all from 'it-all'

const ECHO_PROTOCOL = '/echo/1.0.0'
const addr = new Multiaddr('/ip4/127.0.0.1/tcp/9090/http/p2p-webrtc-direct')
const webRTCDirect = new WebRTCDirect()

const listener = webRTCDirect.createListener({
  handler: (connection) => {
    console.log('new connection opened')

    connection.newStream([ECHO_PROTOCOL])
      .then(({ stream }) => {
        void pipe(stream, stream)
      })
  },
  upgrader
})

await listener.listen(addr)
console.log('listening')

const connection = await webRTCDirect.dial(addr, {
  upgrader
})
const { stream } = await connection.newStream([ECHO_PROTOCOL])
const values = await pipe(
  [uint8arrayFromString('hello')],
  stream,
  (source) => all(source)
)
console.log(`Value: ${uint8ArrayToString(values[0])}`)

// Close connection after reading
await listener.close()
```

Outputs:

```sh
listening
new connection opened
Value: hello
```

Note that it may take some time for the connection to be established.

## API

### Transport

[![](https://raw.githubusercontent.com/libp2p/js-libp2p-interfaces/master/packages/libp2p-interfaces/src/transport/img/badge.png)](https://github.com/libp2p/js-libp2p-interfaces/tree/master/packages/libp2p-interfaces/src/transport)

### Connection

[![](https://raw.githubusercontent.com/libp2p/js-libp2p-interfaces/master/packages/libp2p-interfaces/src/connection/img/badge.png)](https://github.com/libp2p/js-libp2p-interfaces/tree/master/packages/libp2p-interfaces/src/connection)

## Contribute

The libp2p implementation in JavaScript is a work in progress. As such, there are a few things you can do right now to help out:

- Go through the modules and **check out existing issues**. This would be especially useful for modules in active development. Some knowledge of IPFS/libp2p may be required, as well as the infrastructure behind it - for instance, you may need to read up on p2p and more complex operations like muxing to be able to help technically.
- **Perform code reviews**.
- **Add tests**. There can never be enough tests.

## License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

## Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
