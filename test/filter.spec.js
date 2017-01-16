/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const multiaddr = require('multiaddr')

const WebRTCDirect = require('../src')

describe('filter', () => {
  it('filters non valid webrtc-direct multiaddrs', () => {
    const wd = new WebRTCDirect()
    const maArr = [
      multiaddr('/libp2p-webrtc-direct/ip4/1.2.3.4/tcp/3456/http'),
      multiaddr('/ip4/127.0.0.1/tcp/9090/ws'),
      multiaddr('/libp2p-webrtc-direct/ip4/127.0.0.1/tcp/9090/ws/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo2'),
      multiaddr('/ip4/127.0.0.1/tcp/9090/ipfs/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSoooo4')
    ]

    const filtered = wd.filter(maArr)
    expect(filtered.length).to.equal(1)
  })

  it('filter a single addr for this transport', () => {
    const wd = new WebRTCDirect()
    const ma = multiaddr('/libp2p-webrtc-direct/ip4/127.0.0.1/tcp/9090/http')

    const filtered = wd.filter(ma)
    expect(filtered.length).to.equal(1)
  })
})
