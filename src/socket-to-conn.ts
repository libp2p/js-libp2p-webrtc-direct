const abortable = require('abortable-iterator')
import { logger } from '@libp2p/logger'
// @ts-expect-error no types
import toIterable from 'stream-to-it'
// @ts-expect-error no types
import { ipPortToMultiaddr as toMultiaddr } from '@libp2p/utils/ip-port-to-multiaddr'
import { CLOSE_TIMEOUT } from './constants'
// @ts-expect-error no types
import type Peer from 'libp2p-webrtc-peer'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { MultiaddrConnection } from '@libp2p/interfaces/transport'

const log = logger('libp2p:webrtcdirect:socket')

export interface ExtendedMultiaddrConnection extends MultiaddrConnection{
  conn: Peer
}

interface ToConnectionOptions {
  listeningAddr?: Multiaddr
  remoteAddr: Multiaddr
  localAddr?: Multiaddr
  signal?: AbortSignal
}

/**
 * Convert a socket into a MultiaddrConnection
 * https://github.com/libp2p/interface-transport#multiaddrconnection
 */
export const toMultiaddrConnection = (socket: Peer, options: ToConnectionOptions) => {
  const { sink, source } = toIterable.duplex(socket)
  const maConn: ExtendedMultiaddrConnection = {
    async sink (source) {
      if ((options?.signal) != null) {
        source = abortable(source, options.signal)
      }

      try {
        await sink((async function * () {
          for await (const chunk of source) {
            // Convert BufferList to Buffer
            yield chunk instanceof Uint8Array ? chunk : chunk.slice()
          }
        })())
      } catch (err: any) {
        // If aborted we can safely ignore
        if (err.type !== 'aborted') {
          // If the source errored the socket will already have been destroyed by
          // toIterable.duplex(). If the socket errored it will already be
          // destroyed. There's nothing to do here except log the error & return.
          log.error(err)
        }
      }
    },

    source: options.signal ? abortable(source, options.signal) : source,

    conn: socket,

    localAddr: toLocalAddr(socket),

    remoteAddr: options.remoteAddr,

    timeline: { open: Date.now() },

    async close () {
      if (socket.destroyed) return

      return new Promise((resolve, reject) => {
        const start = Date.now()

        // Attempt to end the socket. If it takes longer to close than the
        // timeout, destroy it manually.
        const timeout = setTimeout(() => {
          if (maConn.remoteAddr) {
            const { host, port } = maConn.remoteAddr.toOptions()
            log('timeout closing socket to %s:%s after %dms, destroying it manually',
              host, port, Date.now() - start)
          }

          if (!socket.destroyed) {
            socket.destroy()
          }
        }, CLOSE_TIMEOUT)

        socket.once('close', () => {
          resolve()
        })

        socket.end((err?: Error & { code?: string }) => {
          clearTimeout(timeout)

          maConn.timeline.close = Date.now()
          if (err) return reject(err)
        })
      })
    }
  }

  socket.once('close', () => {
    // In instances where `close` was not explicitly called,
    // such as an iterable stream ending, ensure we have set the close
    // timeline
    if (!maConn.timeline.close) {
      maConn.timeline.close = Date.now()
    }
  })

  return maConn
}

/**
 * Get local multiaddr from socket.
 *
 * @param {SimplePeer} socket
 * @returns {Multiaddr|undefined}
 */
function toLocalAddr (socket) {
  if (socket.localAddress && socket.localPort) {
    try {
      return toMultiaddr(socket.localAddress, socket.localPort)
    } catch {
      // Might fail if the socket.localAddress is fqdn
    }
  }
}
