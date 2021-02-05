/* eslint-env mocha */

'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const { Multiaddr } = require('multiaddr')

const pipe = require('it-pipe')
const { collect } = require('streaming-iterables')
const fromString = require('uint8arrays/from-string')

const WebRTCDirect = require('../src')

const mockUpgrader = {
  upgradeInbound: maConn => maConn,
  upgradeOutbound: maConn => maConn
}

describe('dial', function () {
  this.timeout(20 * 1000)

  const ma = new Multiaddr('/ip4/127.0.0.1/tcp/12345/http/p2p-webrtc-direct')
  let wd

  before(() => {
    wd = new WebRTCDirect({ upgrader: mockUpgrader })
  })

  it('dial on IPv4', async () => {
    const conn = await wd.dial(ma)
    const data = fromString('some data')

    const values = await pipe(
      [data],
      conn,
      collect
    )

    expect(values).to.eql([data])
  })

  it('dial offline / non-existent node on IPv4, check callback', async () => {
    const maOffline = new Multiaddr('/ip4/127.0.0.1/tcp/55555/http/p2p-webrtc-direct')

    try {
      await wd.dial(maOffline, { config: {} })
    } catch (err) {
      expect(err).to.exist()
      return
    }

    throw new Error('dial did not fail')
  })

  it.skip('dial on IPv6', () => {
    // TODO IPv6 not supported yet
  })
})
