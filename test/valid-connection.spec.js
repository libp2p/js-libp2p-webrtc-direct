/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const multiaddr = require('multiaddr')
const pull = require('pull-stream')

const WebRTCDirect = require('../src')

describe('valid Connection', () => {
  const ma = multiaddr('/ip4/127.0.0.1/tcp/12345/http/p2p-webrtc-direct')
  let wd
  let conn

  before((done) => {
    wd = new WebRTCDirect()

    wd.dial(ma, (err, _conn) => {
      expect(err).to.not.exist()
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
      expect(err).to.not.exist()
      expect(addrs[0].toString()).to.equal(ma.toString())
      done()
    })
  })

  it('get Peer Info', (done) => {
    conn.getPeerInfo((err, peerInfo) => {
      expect(err).to.exist()
      done()
    })
  })

  it('set Peer Info', (done) => {
    conn.setPeerInfo('info')
    conn.getPeerInfo((err, peerInfo) => {
      expect(err).to.not.exist()
      expect(peerInfo).to.equal('info')
      done()
    })
  })
})
