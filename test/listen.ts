/* eslint-env mocha */

import { expect } from 'aegir/chai'
import { multiaddr } from '@multiformats/multiaddr'
import { mockRegistrar, mockUpgrader } from '@libp2p/interface-mocks'
import { isBrowser } from 'wherearewe'
import { pipe } from 'it-pipe'
import { pEvent } from 'p-event'
import type { Transport } from '@libp2p/interface-transport'
import { EventEmitter } from '@libp2p/interfaces/events'

const ECHO_PROTOCOL = '/echo/1.0.0'

export default (create: () => Promise<Transport>): void => {
  describe('listen', function () {
    this.timeout(20 * 1000)

    if (isBrowser) {
      return
    }

    let wd: Transport

    const ma = multiaddr('/ip4/127.0.0.1/tcp/20123/http/p2p-webrtc-direct')

    before(async () => {
      wd = await create()
    })

    it('listen, check for promise', async () => {
      const listener = wd.createListener({
        upgrader: mockUpgrader({
          events: new EventEmitter()
        })
      })

      await listener.listen(ma)
      await listener.close()
    })

    it('listen, check for listening event', (done) => {
      const listener = wd.createListener({
        upgrader: mockUpgrader({
          events: new EventEmitter()
        })
      })

      listener.addEventListener('listening', () => {
        void listener.close()
          .then(done, done)
      }, {
        once: true
      })
      void listener.listen(ma)
    })

    it('listen, check for the close event', (done) => {
      const listener = wd.createListener({
        upgrader: mockUpgrader({
          events: new EventEmitter()
        })
      })
      void listener.listen(ma).then(async () => {
        listener.addEventListener('close', () => { done() }, {
          once: true
        })

        await listener.close()
      })
    })

    it('listen in 0.0.0.0', async () => {
      const listener = wd.createListener({
        upgrader: mockUpgrader({
          events: new EventEmitter()
        })
      })

      await listener.listen(multiaddr('/ip4/0.0.0.0/tcp/48322'))
      await listener.close()
    })

    it('listen in port 0', async () => {
      const listener = wd.createListener({
        upgrader: mockUpgrader({
          events: new EventEmitter()
        })
      })

      await listener.listen(multiaddr('/ip4/127.0.0.1/tcp/0'))
      await listener.close()
    })

    it('listen on IPv6 addr', async () => {
      const listener = wd.createListener({
        upgrader: mockUpgrader({
          events: new EventEmitter()
        })
      })

      await listener.listen(multiaddr('/ip6/::1/tcp/48322'))
      await listener.close()
    })

    it('getAddrs', async () => {
      const listener = wd.createListener({
        upgrader: mockUpgrader({
          events: new EventEmitter()
        })
      })

      await listener.listen(ma)

      const addrs = listener.getAddrs()
      expect(addrs[0]).to.deep.equal(ma)

      await listener.close()
    })

    it('should untrack conn after being closed', async function () {
      const ma1 = multiaddr('/ip4/127.0.0.1/tcp/12346/http/p2p-webrtc-direct')
      const registrar = mockRegistrar()
      void registrar.handle(ECHO_PROTOCOL, ({ stream }) => {
        void pipe(
          stream,
          stream
        )
      })
      const upgrader = mockUpgrader({
        registrar,
        events: new EventEmitter()
      })

      const wd1 = await create()
      const listener1 = wd1.createListener({
        upgrader,
        handler: (conn) => {
          void conn.newStream([ECHO_PROTOCOL])
            .then((stream) => {
              void pipe(stream, stream)
            })
        }
      })

      await listener1.listen(ma1)
      expect(listener1).to.have.nested.property('server.connections').that.has.lengthOf(0)

      const conn = await wd.dial(ma1, {
        upgrader
      })

      // wait for listener to know of the connect
      await pEvent(listener1, 'connection')

      expect(listener1).to.have.nested.property('server.connections').that.has.lengthOf(1)

      await conn.close()

      // wait for listener to know of the disconnect
      await new Promise((resolve) => {
        setTimeout(resolve, 1000)
      })

      expect(listener1).to.have.nested.property('server.connections').that.has.lengthOf(0)

      await listener1.close()
    })

    it('should have remoteAddress in listener connection', async function () {
      const ma1 = multiaddr('/ip4/127.0.0.1/tcp/12346/http/p2p-webrtc-direct')
      const registrar = mockRegistrar()
      void registrar.handle(ECHO_PROTOCOL, ({ stream }) => {
        void pipe(
          stream,
          stream
        )
      })
      const upgrader = mockUpgrader({
        registrar,
        events: new EventEmitter()
      })

      const wd1 = await create()
      const listener1 = wd1.createListener({
        handler: (conn) => {
          expect(conn.remoteAddr).to.exist()

          void conn.newStream([ECHO_PROTOCOL])
            .then((stream) => {
              void pipe(stream, stream)
            })
        },
        upgrader
      })

      await listener1.listen(ma1)
      const conn = await wd.dial(ma1, {
        upgrader
      })
      expect(conn.remoteAddr).to.exist()

      await conn.close()
      await listener1.close()
    })
  })
}
