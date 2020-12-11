'use strict'

const WebRTCDirect = require('./src')
const pipe = require('it-pipe')
const multiaddr = require('multiaddr')

const ma = multiaddr('/ip4/127.0.0.1/tcp/12345/http/p2p-webrtc-direct')
let listener

const mockUpgrader = {
  upgradeInbound: maConn => maConn,
  upgradeOutbound: maConn => maConn
}

function boot () {
  const wd = new WebRTCDirect({ upgrader: mockUpgrader })

  listener = wd.createListener((conn) => pipe(conn, conn))
  listener.on('listening', () => {
    console.log('listener started on:', ma.toString())
  })
  listener.on('error', console.error)
  return listener.listen(ma)
}

async function shutdown () {
  await listener.close()
  // TODO: Temporary fix per wrtc issue
  // https://github.com/node-webrtc/node-webrtc/issues/636
  process.exit(0)
}

module.exports = {
  hooks: {
    pre: boot,
    post: shutdown
  }
}
