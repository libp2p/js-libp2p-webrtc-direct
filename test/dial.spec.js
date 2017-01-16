/* eslint-env mocha */

'use strict'

const expect = require('chai').expect
const multiaddr = require('multiaddr')
const pull = require('pull-stream')

const WebRTCDirect = require('../src')

describe('dial', () => {
  const ma = multiaddr('/libp2p-webrtc-direct/ip4/127.0.0.1/tcp/12345/http')
  let wd

  before(() => {
    wd = new WebRTCDirect()
  })

  it('dial on IPv4, check callback', (done) => {
    wd.dial(ma, (err, conn) => {
      expect(err).to.not.exist

      const data = new Buffer('some data')

      pull(
        pull.values([data]),
        conn,
        pull.collect((err, values) => {
          expect(err).to.not.exist
          expect(values).to.eql([data])
          done()
        })
      )
    })
  })

  it('dial offline / non-existent node on IPv4, check callback', (done) => {
    let maOffline = multiaddr('/libp2p-webrtc-direct/ip4/127.0.0.1/tcp/55555/http')

    wd.dial(maOffline, (err, conn) => {
      expect(err).to.exist
      done()
    })
  })

  it.skip('dial on IPv6', (done) => {
    // TODO IPv6 not supported yet
  })
})
