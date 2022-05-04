/* eslint-env mocha */

import { expect } from 'aegir/chai'
import { WebRTCDirect } from '../src/index.js'

describe('instances', () => {
  it('create', (done) => {
    const wdirect = new WebRTCDirect()
    expect(wdirect).to.exist()
    done()
  })

  it('create without new throws', (done) => {
    // @ts-expect-error need new keyword
    expect(() => WebRTCDirect()).to.throw()
    done()
  })
})
