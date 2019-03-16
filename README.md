# js-libp2p-webrtc-direct

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://protocol.ai)
[![](https://img.shields.io/badge/project-libp2p-yellow.svg?style=flat-square)](http://libp2p.io/)
[![](https://img.shields.io/badge/freenode-%23libp2p-yellow.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23libp2p)
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
const pull = require('pull-stream')

const mh = multiaddr('/ip4/127.0.0.1/tcp/9090/http/p2p-webrtc-direct')

const webRTCDirect = new WebRTCDirect()

const listener = webRTCDirect.createListener((socket) => {
  console.log('new connection opened')
  pull(
    pull.values(['hello']),
    socket
  )
})

listener.listen(mh, () => {
  console.log('listening')

  webRTCDirect.dial(mh, (err, conn) => {
    if (!err) {
      pull(
        conn,
        pull.collect((err, values) => {
          if (!err) {
            console.log(`Value: ${values.toString()}`)
          } else {
            console.log(`Error: ${err}`)
          }
          
          // Close connection after reading
          listener.close()
        }),
      )
    } else {
      console.log(`Error: ${err}`)
    }
  })
})
```

Outputs:

```sh
listening
new connection opened
Value: hello
```
Note that it may take some time for the connection to be established.

## API

Follows the interface defined by `interface-transport`

[![](https://raw.githubusercontent.com/diasdavid/interface-transport/master/img/badge.png)](https://github.com/libp2p/interface-transport)

## Pull-streams

### This module uses `pull-streams`

We expose a streaming interface based on `pull-streams`, rather then on the Node.js core streams implementation (aka Node.js streams). `pull-streams` offers us a better mechanism for error handling and flow control guarantees. If you would like to know more about why we did this, see the discussion at this [issue](https://github.com/ipfs/js-ipfs/issues/362).

You can learn more about pull-streams at:

- [The history of Node.js streams, nodebp April 2014](https://www.youtube.com/watch?v=g5ewQEuXjsQ)
- [The history of streams, 2016](http://dominictarr.com/post/145135293917/history-of-streams)
- [pull-streams, the simple streaming primitive](http://dominictarr.com/post/149248845122/pull-streams-pull-streams-are-a-very-simple)
- [pull-streams documentation](https://pull-stream.github.io/)

#### Converting `pull-streams` to Node.js Streams

If you are a Node.js streams user, you can convert a pull-stream to a Node.js stream using the module [`pull-stream-to-stream`](https://github.com/pull-stream/pull-stream-to-stream), giving you an instance of a Node.js stream that is linked to the pull-stream. For example:

```JavaScript
const pullToStream = require('pull-stream-to-stream')

const nodeStreamInstance = pullToStream(pullStreamInstance)
// nodeStreamInstance is an instance of a Node.js Stream
```

To learn more about this utility, visit https://pull-stream.github.io/#pull-stream-to-stream.
