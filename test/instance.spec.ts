/* eslint-env mocha */

import { expect } from 'aegir/chai'
import { webRTCDirect } from '../src/index.js'

describe('instances', () => {
  it('create', (done) => {
    const wdirect = webRTCDirect()()
    expect(wdirect).to.exist()
    done()
  })
})
