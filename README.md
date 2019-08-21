# js-libp2p-webrtc-direct

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://protocol.ai)
[![](https://img.shields.io/badge/project-libp2p-yellow.svg?style=flat-square)](http://libp2p.io/)
[![](https://img.shields.io/badge/freenode-%23libp2p-yellow.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23libp2p)
[![Discourse posts](https://img.shields.io/discourse/https/discuss.libp2p.io/posts.svg)](https://discuss.libp2p.io)
[![](https://img.shields.io/codecov/c/github/libp2p/js-libp2p-webrtc-direct.svg?style=flat-square)](https://codecov.io/gh/libp2p/js-libp2p-webrtc-direct)
[![](https://img.shields.io/travis/libp2p/js-libp2p-webrtc-direct.svg?style=flat-square)](https://travis-ci.com/libp2p/js-libp2p-webrtc-direct)
[![Dependency Status](https://david-dm.org/libp2p/js-libp2p-webrtc-direct.svg?style=flat-square)](https://david-dm.org/libp2p/js-libp2p-webrtc-direct) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)

![](https://raw.githubusercontent.com/libp2p/interface-connection/master/img/badge.png)
![](https://raw.githubusercontent.com/libp2p/interface-transport/master/img/badge.png)

> A WebRTC transport built for libp2p (not mandatory to use with libp2p) that doesn't require the set up a signalling server. Caveat, you can only establish Browser to Node.js and Node.js to Node.js connections.

## Lead Maintainer

[Vasco Santos](https://github.com/vasco-santos).

## Table of Contents

- [Install](#install)
  - [npm](#npm)
- [Usage](#usage)
- [API](#api)
- [Pull-streams](#pull-streams)


## Install

### npm

```bash
> npm install libp2p-webrtc-direct
```

## Usage

```js
const WebRTCDirect = require('libp2p-webrtc-direct')
const multiaddr = require('multiaddr')
const pipe = require('pull-stream')
const { collect } = require('streaming-iterables')

const addr = multiaddr('/ip4/127.0.0.1/tcp/9090/http/p2p-webrtc-direct')

const webRTCDirect = new WebRTCDirect()

const listener = webRTCDirect.createListener((socket) => {
  console.log('new connection opened')
  pipe(
    ['hello'],
    socket
  )
})

await listener.listen(addr)
console.log('listening')

const conn = await webRTCDirect.dial(addr)
const values = await pipe(
  conn,
  collect
)
console.log(`Value: ${values.toString()}`)

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

[![](https://raw.githubusercontent.com/libp2p/interface-transport/master/img/badge.png)](https://github.com/libp2p/interface-transport)

### Connection

[![](https://raw.githubusercontent.com/libp2p/interface-connection/master/img/badge.png)](https://github.com/libp2p/interface-connection)

## Contribute

The libp2p implementation in JavaScript is a work in progress. As such, there are a few things you can do right now to help out:

 - Go through the modules and **check out existing issues**. This would be especially useful for modules in active development. Some knowledge of IPFS/libp2p may be required, as well as the infrastructure behind it - for instance, you may need to read up on p2p and more complex operations like muxing to be able to help technically.
 - **Perform code reviews**.
 - **Add tests**. There can never be enough tests.

## License

[MIT](LICENSE) © Protocol Labs
