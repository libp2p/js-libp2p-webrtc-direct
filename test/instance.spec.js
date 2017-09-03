/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const WebRTCDirect = require('../src')

describe('instances', () => {
  it('create', (done) => {
    const wdirect = new WebRTCDirect()
    expect(wdirect).to.exist()
    done()
  })

  it('create without new throws', (done) => {
    expect(() => WebRTCDirect()).to.throw()
    done()
  })
})
