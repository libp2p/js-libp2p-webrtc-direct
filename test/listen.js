/* eslint-env mocha */

'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)
const multiaddr = require('multiaddr')
const WebRTCDirect = require('../src')

const mockUpgrader = {
  upgradeInbound: maConn => maConn,
  upgradeOutbound: maConn => maConn
}

describe('listen', () => {
  let wd

  const ma = multiaddr('/ip4/127.0.0.1/tcp/20123/http/p2p-webrtc-direct')

  before(() => {
    wd = new WebRTCDirect({ upgrader: mockUpgrader })
  })

  it('listen, check for promise', async () => {
    const listener = wd.createListener({ config: {} }, (_) => { })

    await listener.listen(ma)
    await listener.close()
  })

  it('listen, check for listening event', (done) => {
    const listener = wd.createListener({ config: {} }, (conn) => {})

    listener.once('listening', async () => {
      await listener.close()
      done()
    })
    listener.listen(ma)
  })

  it('listen, check for the close event', (done) => {
    const listener = wd.createListener({ config: {} }, (conn) => {})
    listener.listen(ma).then(() => {
      listener.once('close', done)

      listener.close()
    })
  })

  it.skip('listen in 0.0.0.0', (done) => {
    // TODO
  })

  it.skip('listen in port 0', (done) => {
    // TODO
  })

  it.skip('close listener with connections, through timeout', (done) => {
    // TODO
  })

  it.skip('listen on IPv6 addr', (done) => {
    // TODO IPv6 not supported yet
  })

  it('getAddrs', async () => {
    const listener = wd.createListener({ config: {} }, (conn) => {})

    await listener.listen(ma)

    const addrs = listener.getAddrs()
    expect(addrs[0]).to.deep.equal(ma)

    await listener.close()
  })
})
