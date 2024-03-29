/* eslint-env mocha */

import { expect } from 'aegir/chai'
import { multiaddr } from '@multiformats/multiaddr'
import { webRTCDirect } from '../src/index.js'

describe('filter', () => {
  it('filters non valid webrtc-direct multiaddrs', () => {
    const wd = webRTCDirect()()
    const maArr = [
      multiaddr('/ip4/1.2.3.4/tcp/3456/http/p2p-webrtc-direct'),
      multiaddr('/ip4/127.0.0.1/tcp/9090/ws'),
      multiaddr('/ip4/127.0.0.1/tcp/9090/ws/p2p-webrtc-direct/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo2'),
      multiaddr('/ip4/127.0.0.1/tcp/9090/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo4'),
      multiaddr('/ip4/127.0.0.1/tcp/9090/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo4' +
        '/p2p-circuit/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo5')
    ]

    const filtered = wd.filter(maArr)
    expect(filtered.length).to.equal(1)
  })

  it('filter a single addr for this transport', () => {
    const wd = webRTCDirect()()
    const ma = multiaddr('/ip4/127.0.0.1/tcp/9090/http/p2p-webrtc-direct')

    const filtered = wd.filter([ma])
    expect(filtered.length).to.equal(1)
  })
})
