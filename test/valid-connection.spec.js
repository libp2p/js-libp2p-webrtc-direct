/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const multiaddr = require('multiaddr')
const pull = require('pull-stream')

const WebRTCDirect = require('../src')

describe('valid Connection', () => {
  const ma = multiaddr('/libp2p-webrtc-direct/ip4/127.0.0.1/tcp/12345/http')
  let wd
  let conn

  before((done) => {
    wd = new WebRTCDirect()

    wd.dial(ma, (err, _conn) => {
      expect(err).to.not.exist
      conn = _conn
      done()
    })
  })

  after((done) => {
    pull(
      pull.empty(),
      conn,
      pull.onEnd(done)
    )
  })

  it('get observed addrs', (done) => {
    conn.getObservedAddrs((err, addrs) => {
      expect(err).to.not.exist
      expect(addrs[0].toString()).to.equal(ma.toString())
      done()
    })
  })

  it('get Peer Info', (done) => {
    conn.getPeerInfo((err, peerInfo) => {
      expect(err).to.exist
      done()
    })
  })

  it('set Peer Info', (done) => {
    conn.setPeerInfo('info')
    conn.getPeerInfo((err, peerInfo) => {
      expect(err).to.not.exist
      expect(peerInfo).to.equal('info')
      done()
    })
  })
})

