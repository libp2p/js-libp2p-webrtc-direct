
import listenTests from './listen.js'
import dialTests from './dial.js'
import { webRTCDirect } from '../src/index.js'

describe('browser RTC', () => {
  const create = async () => {
    const ws = webRTCDirect()()

    return ws
  }

  dialTests(create)
  listenTests(create)
})
