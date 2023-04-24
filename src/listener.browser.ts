import type { Listener } from '@libp2p/interface-transport'

export function createListener (): Listener {
  throw new Error('WebRTCDirect Servers can not be created in the browser!')
}
