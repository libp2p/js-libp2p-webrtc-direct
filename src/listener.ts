import http from 'http'
import { logger } from '@libp2p/logger'

// @ts-expect-error no types
import isNode from 'detect-node'
// @ts-expect-error no types
import wrtc from 'wrtc'
// @ts-expect-error no types
import SimplePeer from 'libp2p-webrtc-peer'
import { base58btc } from 'multiformats/bases/base58'
import { toString } from 'uint8arrays/to-string'
import { fromString } from 'uint8arrays/from-string'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { IncomingMessage, ServerResponse } from 'http'
import { EventEmitter, CustomEvent } from '@libp2p/interfaces'
import type { Connection } from '@libp2p/interfaces/connection'
import type { Upgrader, Listener } from '@libp2p/interfaces/transport'
import ipPortToMultiaddr from 'libp2p-utils/src/ip-port-to-multiaddr'

import { toMultiaddrConnection } from './socket-to-conn'
import type { WebRTCDirectListenerOptions } from './index'
import type { ExtendedMultiaddrConnection } from './socket-to-conn'


const log = logger('libp2p:webrtcdirect:listener')

interface WebRTCDirectListener extends Listener {
  __connections: ExtendedMultiaddrConnection[]
}

export function createListener (upgrader: Upgrader, options?: WebRTCDirectListenerOptions) {
  const handler = options?.handler
  const channelOptions = options?.channelOptions
  const server = http.createServer()

  let maSelf: Multiaddr

  server.on('request', async (req: IncomingMessage, res: ServerResponse) => {
    if (!req?.socket?.remoteAddress || !req?.socket.remotePort || !req.url) {
      const err = new Error('Invalid listener request. Specify request\'s url, remoteAddress, remotePort.')
      log.error(err)
      res.writeHead(500);
      res.end(err);
      return
    }
    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Access-Control-Allow-Origin', '*')

    const path = req.url
    const incSignalStr = path.split('?signal=')[1]
    const incSignalBuf = base58btc.decode(incSignalStr)
    const incSignal = JSON.parse(toString(incSignalBuf))

    const channel = new SimplePeer({
      trickle: false,
      wrtc: isNode ? wrtc : undefined,
      ...channelOptions
    })

    const maConn = toMultiaddrConnection(channel, {
      remoteAddr: ipPortToMultiaddr(req.socket.remoteAddress, req.socket.remotePort)
    })
    log('new inbound connection %s', maConn.remoteAddr)

    channel.on('error', (err: Error) => {
      log.error(`incoming connectioned errored with ${err}`)
    })
    channel.once('close', () => {
      channel.removeAllListeners('error')
    })
    channel.on('signal', (signal: Object) => {
      const signalStr = JSON.stringify(signal)
      const signalEncoded = base58btc.encode(fromString(signalStr))
      res.end(Buffer.from(signalEncoded))
    })

    channel.signal(incSignal)

    let conn: Connection
    try {
      conn = await upgrader.upgradeInbound(maConn)
    } catch (err) {
      log.error('inbound connection failed to upgrade', err)
      return maConn.close()
    }
    log('inbound connection %s upgraded', maConn.remoteAddr)

    trackConn(listener, maConn)

    channel.on('connect', () => {
      listener.dispatchEvent(new CustomEvent('connection', {detail: conn}))
      if (handler)
        handler(conn)

      channel.removeAllListeners('connect')
      channel.removeAllListeners('signal')
    })
  })

  server.on('error', (err) => listener.dispatchEvent(new CustomEvent('error', {detail: err})))
  server.on('close', () => listener.dispatchEvent(new CustomEvent('close')))

  const listener: WebRTCDirectListener = Object.assign(new EventEmitter(), {
      listen: (ma: Multiaddr) => {
        maSelf = ma
        const lOpts = ma.toOptions()

        return new Promise<void>((resolve, reject) => {
          server.on('listening', (err: Error) => {
            if (err) {
              return reject(err)
            }

            listener.dispatchEvent(new CustomEvent('listening'))
            log('Listening on %s %s', lOpts.port, lOpts.host)
            resolve()
          })

          server.listen(lOpts)
        })
      },

      close: async () => {
        if (!server.listening) {
          return
        }

        await Promise.all(listener.__connections.map(c => c.close()))
        return new Promise<void>((resolve, reject) => {
          server.close((err) => err ? reject(err) : resolve())
        })
      },

      getAddrs: () => {
        return [maSelf]
      }
    },
    // Keep track of open connections to destroy in case of timeout
    {__connections: []})

  return listener
}

function trackConn (listener: WebRTCDirectListener, maConn: ExtendedMultiaddrConnection) {
  listener.__connections.push(maConn)

  const untrackConn = () => {
    listener.__connections = listener.__connections.filter(c => c !== maConn)
  }

  maConn.conn.once('close', untrackConn)
}
