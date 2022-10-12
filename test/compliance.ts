/* eslint-env mocha */

import type { Transport } from '@libp2p/interface-transport'
import tests from '@libp2p/interface-transport-compliance-tests'
import { multiaddr } from '@multiformats/multiaddr'

export default (create: () => Promise<Transport>) => {
  describe('interface-transport compliance', function () {
    this.timeout(20 * 1000)

    tests({
      async setup () {
        const ws = await create()

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
      },
      async teardown () {}
    })
  })
}
