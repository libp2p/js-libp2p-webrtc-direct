/* eslint-env mocha */
'use strict'

const wrtc = require('wrtc')

const testsTransport = require('libp2p-interfaces/src/transport/tests')
const multiaddr = require('multiaddr')

const WDirect = require('../src')

describe('interface-transport compliance', () => {
  testsTransport({
    setup ({ upgrader }) {
      const ws = new WDirect({ upgrader, wrtc: wrtc })

      const addrs = [
        multiaddr('/ip4/127.0.0.1/tcp/22222/http/p2p-webrtc-direct'),
        multiaddr('/ip4/127.0.0.1/tcp/33333/http/p2p-webrtc-direct'),
        multiaddr('/ip4/127.0.0.1/tcp/44444/http/p2p-webrtc-direct'),
        multiaddr('/ip4/127.0.0.1/tcp/55555/http/p2p-webrtc-direct')
      ]

      // Used by the dial tests to simulate a delayed connect
      const connector = {
        delay () {},
        restore () {}
      }

      return { transport: ws, addrs, connector }
    }
  })
})
