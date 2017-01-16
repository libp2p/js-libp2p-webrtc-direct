/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const WebRTCDirect = require('../src')

describe('instances', () => {
  it('create', (done) => {
    const wdirect = new WebRTCDirect()
    expect(wdirect).to.exist
    done()
  })

  it('create without new throws', (done) => {
    expect(() => {
      WebRTCDirect()
    }).to.throw()
    done()
  })
})
