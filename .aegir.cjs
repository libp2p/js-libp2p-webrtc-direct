'use strict'

const wrtc = require('wrtc')

// TODO: Temporary fix per wrtc issue
// https://github.com/node-webrtc/node-webrtc/issues/636#issuecomment-774171409
process.on('beforeExit', (code) => process.exit(code))

const ECHO_PROTOCOL = '/echo/1.0.0'

async function before () {
  const { webRTCDirect } = await import('./dist/src/index.js')
  const { pipe } = await import('it-pipe')
  const { multiaddr } = await import('@multiformats/multiaddr')
  const { mockUpgrader, mockRegistrar } = await import('@libp2p/interface-mocks')
  const { EventEmitter } = await import('@libp2p/interfaces/events')

  const REMOTE_MULTIADDR_IP4 = multiaddr('/ip4/127.0.0.1/tcp/12345/http/p2p-webrtc-direct')
  const REMOTE_MULTIADDR_IP6 = multiaddr('/ip6/::1/tcp/12346/http/p2p-webrtc-direct')

  const registrar = mockRegistrar()
  void registrar.handle(ECHO_PROTOCOL, ({ stream }) => {
    void pipe(
      stream,
      stream
    ).catch()
  })
  const upgrader = mockUpgrader({
    registrar,
    events: new EventEmitter()
  })

  const wd = webRTCDirect({
    wrtc
  })()

  const listeners = await Promise.all(
    [REMOTE_MULTIADDR_IP4, REMOTE_MULTIADDR_IP6].map(async ma => {
      const listener = wd.createListener({
        upgrader
      })
      await listener.listen(ma)

      return listener
    })
  )

  return {
    listeners
  }
}

async function after (testOptions, beforeReturn) {
  await Promise.all(
    beforeReturn.listeners.map(listener => listener.close())
  )
}

/** @type {import('aegir').PartialOptions} */
module.exports = {
  test: {
    before,
    after
  }
}
