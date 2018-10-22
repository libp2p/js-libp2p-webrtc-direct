/* eslint-env mocha */

'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)
const multiaddr = require('multiaddr')
const WebRTCDirect = require('../src')

describe('listen', () => {
  let wd

  const ma = multiaddr('/ip4/127.0.0.1/tcp/20123/http/p2p-webrtc-direct')

  before(() => {
    wd = new WebRTCDirect()
  })

  it('listen, check for callback', (done) => {
    const listener = wd.createListener({ config: {} }, (conn) => {})

    listener.listen(ma, (err) => {
      expect(err).to.not.exist()
      listener.close(done)
    })
  })

  it('listen, check for listening event', (done) => {
    const listener = wd.createListener({ config: {} }, (conn) => {})

    listener.once('listening', () => {
      listener.close(done)
    })
    listener.listen(ma)
  })

  it('listen, check for the close event', (done) => {
    const listener = wd.createListener({ config: {} }, (conn) => {})
    listener.listen(ma, (err) => {
      expect(err).to.not.exist()
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

  it('getAddrs', (done) => {
    const listener = wd.createListener({ config: {} }, (conn) => {})
    listener.listen(ma, (err) => {
      expect(err).to.not.exist()
      listener.getAddrs((err, addrs) => {
        expect(err).to.not.exist()
        expect(addrs[0]).to.deep.equal(ma)
        listener.close(done)
      })
    })
  })
})
