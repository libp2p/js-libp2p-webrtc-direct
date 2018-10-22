/* eslint-env mocha */

'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const multiaddr = require('multiaddr')
const pull = require('pull-stream')

const WebRTCDirect = require('../src')

describe('dial', () => {
  const ma = multiaddr('/ip4/127.0.0.1/tcp/12345/http/p2p-webrtc-direct')
  let wd

  before(() => {
    wd = new WebRTCDirect()
  })

  it('dial on IPv4, check callback', (done) => {
    wd.dial(ma, { config: {} }, (err, conn) => {
      expect(err).to.not.exist()

      const data = Buffer.from('some data')

      pull(
        pull.values([data]),
        conn,
        pull.collect((err, values) => {
          expect(err).to.not.exist()
          expect(values).to.eql([data])
          done()
        })
      )
    })
  })

  it('dial offline / non-existent node on IPv4, check callback', (done) => {
    let maOffline = multiaddr('/ip4/127.0.0.1/tcp/55555/http/p2p-webrtc-direct')

    wd.dial(maOffline, { config: {} }, (err, conn) => {
      expect(err).to.exist()
      done()
    })
  })

  it.skip('dial on IPv6', (done) => {
    // TODO IPv6 not supported yet
  })
})
