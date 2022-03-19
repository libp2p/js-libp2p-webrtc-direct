
import listenTests from './listen.js'
import dialTests from './dial.js'
import { WebRTCDirect } from '../src/index.js'

describe('browser RTC', () => {
  const create = async () => {
    const ws = new WebRTCDirect()

    return ws
  }

  dialTests(create)
  listenTests(create)
})
