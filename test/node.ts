
import listenTests from './listen.js'
import complianceTests from './compliance.js'
import dialTests from './dial.js'
// @ts-expect-error no types
import wrtc from 'wrtc'
import { WebRTCDirect } from '../src/index.js'

// TODO: Temporary fix per wrtc issue
// https://github.com/node-webrtc/node-webrtc/issues/636#issuecomment-774171409
process.on('beforeExit', (code) => process.exit(code))

describe('transport: with wrtc', () => {
  const create = async () => {
    const ws = new WebRTCDirect({
      wrtc
    })

    return ws
  }

  dialTests(create)
  listenTests(create)
  complianceTests(create)
})
