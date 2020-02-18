/* eslint-env mocha */

'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const delay = require('delay')
const multiaddr = require('multiaddr')
const pipe = require('it-pipe')

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

  it('should untrack conn after being closed', async function () {
    this.timeout(20e3)

    const ma1 = multiaddr('/ip4/127.0.0.1/tcp/12346/http/p2p-webrtc-direct')

    const wd1 = new WebRTCDirect({ upgrader: mockUpgrader })
    const listener1 = wd1.createListener((conn) => pipe(conn, conn))

    await listener1.listen(ma1)
    expect(listener1.__connections).to.have.lengthOf(0)

    const conn = await wd.dial(ma1)
    // wait for listener to know of the connect
    await delay(1000)

    expect(listener1.__connections).to.have.lengthOf(1)

    await conn.close()

    // wait for listener to know of the disconnect
    await delay(1000)

    expect(listener1.__connections).to.have.lengthOf(0)
  })
})
