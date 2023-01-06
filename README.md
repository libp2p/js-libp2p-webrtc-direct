# ⚠️⚠️⚠️⚠️⚠️⚠️  <!-- omit in toc -->
**Status:**

[Archived](https://github.com/libp2p/github-mgmt/pull/80) and not maintained

**Alternatives:**

WebRTC Browser-to-Server is being implemented in js-libp2p and tracked here https://github.com/libp2p/js-libp2p/issues/1478 per the specification: https://github.com/libp2p/specs/pull/412

WebRTC Browser-to-Browser is being tracked here: https://github.com/libp2p/js-libp2p/issues/1462

**Questions:**

Please direct any questions about the specification to: https://github.com/libp2p/specs/issues

Please direct any questions about the js-libp2p WebRTC implementations to:
https://github.com/libp2p/js-libp2p/issues/1478 or
https://github.com/libp2p/js-libp2p/issues/1462
# ⚠️⚠️⚠️⚠️⚠️⚠️  <!-- omit in toc -->

# @libp2p/webrtc-direct <!-- omit in toc -->

[![libp2p.io](https://img.shields.io/badge/project-libp2p-yellow.svg?style=flat-square)](http://libp2p.io/)
[![Discuss](https://img.shields.io/discourse/https/discuss.libp2p.io/posts.svg?style=flat-square)](https://discuss.libp2p.io)
[![codecov](https://img.shields.io/codecov/c/github/libp2p/js-libp2p-webrtc-direct.svg?style=flat-square)](https://codecov.io/gh/libp2p/js-libp2p-webrtc-direct)
[![CI](https://img.shields.io/github/actions/workflow/status/libp2p/js-libp2p-webrtc-direct/js-test-and-release.yml?branch=master\&style=flat-square)](https://github.com/libp2p/js-libp2p-webrtc-direct/actions/workflows/js-test-and-release.yml?query=branch%3Amaster)

> Dial using WebRTC without the need to set up any Signalling Rendezvous Point!

## Table of contents <!-- omit in toc -->

- [Install](#install)
  - [Browser `<script>` tag](#browser-script-tag)
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

### Browser `<script>` tag

Loading this module through a script tag will make it's exports available as `Libp2pWebrtcDirect` in the global namespace.

```html
<script src="https://unpkg.com/@libp2p/webrtc-direct/dist/index.min.js"></script>
```

![](https://raw.githubusercontent.com/libp2p/js-libp2p-interfaces/master/packages/libp2p-interfaces/src/connection/img/badge.png)
![](https://raw.githubusercontent.com/libp2p/js-libp2p-interfaces/master/packages/libp2p-interfaces/src/transport/img/badge.png)

**NOTE:** To run build scripts `node-pre-gyp` is required. You can install it by running `npm install -g node-pre-gyp`.

## Usage

```js
import { createLibp2p } from 'libp2p'
import { webRTCDirect } from '@libp2p/webrtc-direct'

const node = await createLibp2p({
  transports: [
    webRTCDirect()
  ]
  //... other config
})
await node.start()
await node.dial('/ip4/127.0.0.1/tcp/9090/http/p2p-webrtc-direct')
```

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
