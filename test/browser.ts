
import listenTests from './listen.js'
import dialTests from './dial.js'
import { webRTCDirect } from '../src/index.js'
import type { Transport } from '@libp2p/interface-transport'

describe('browser RTC', () => {
  const create = async (): Promise<Transport> => {
    const ws = webRTCDirect()()

    return ws
  }

  dialTests(create)
  listenTests(create)
})
