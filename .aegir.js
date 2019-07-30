'use strict'

const WebRTCDirect = require('./src')
const pull = require('pull-stream')
const multiaddr = require('multiaddr')

const ma = multiaddr('/ip4/127.0.0.1/tcp/12345/http/p2p-webrtc-direct')
let listener

function boot (done) {
  const wd = new WebRTCDirect()
  listener = wd.createListener((conn) => pull(conn, conn))
  listener.listen(ma, done)
  listener.on('listening', () => {
    console.log('listener started on:', ma.toString())
  })
}

function shutdown (done) {
  listener.close(done)
}

module.exports = {
  hooks: {
    pre: boot,
    post: shutdown
  }
}
