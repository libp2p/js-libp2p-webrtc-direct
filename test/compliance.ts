/* eslint-env mocha */

import tests from '@libp2p/interface-compliance-tests/transport'
import { Multiaddr } from '@multiformats/multiaddr'
import type { WebRTCDirect } from '../src/index.js'

export default (create: () => Promise<WebRTCDirect>) => {
  describe('interface-transport compliance', function () {
    this.timeout(540 * 1000)

    tests({
      async setup () {
        const ws = await create()

        const addrs = [
          new Multiaddr('/ip4/127.0.0.1/tcp/22222/http/p2p-webrtc-direct'),
          new Multiaddr('/ip4/127.0.0.1/tcp/33333/http/p2p-webrtc-direct'),
          new Multiaddr('/ip4/127.0.0.1/tcp/44444/http/p2p-webrtc-direct'),
          new Multiaddr('/ip4/127.0.0.1/tcp/55555/http/p2p-webrtc-direct')
        ]

        // Used by the dial tests to simulate a delayed connect
        const connector = {
          delay () {},
          restore () {}
        }

        return { transport: ws, addrs, connector }
      },
      async teardown () {}
    })
  })
}
