import { logger } from '@libp2p/logger'
import errcode from 'err-code'
// @ts-expect-error no types
import wrtc from 'wrtc'
// @ts-expect-error no types
import SimplePeer from 'libp2p-webrtc-peer'
// @ts-expect-error no types
import isNode from 'detect-node'
import mafmt from 'mafmt'
import { base58btc } from 'multiformats/bases/base58'
import { fetch } from 'native-fetch'
import { AbortError } from 'abortable-iterator'
import { toString } from 'uint8arrays/to-string'
import { fromString } from 'uint8arrays/from-string'
import { CODE_CIRCUIT, CODE_P2P } from './constants'
import { toMultiaddrConnection } from './socket-to-conn'
import { createListener } from './listener'

import type { AbortOptions } from '@libp2p/interfaces'
import type { Listener, ListenerOptions, Transport, Upgrader } from '@libp2p/interfaces/transport'
import type { Multiaddr } from '@multiformats/multiaddr'

const log = logger('libp2p:webrtcdirect')

interface SimplePeerOptions {
  channelConfig?: Object,
  channelName?: string,
  config?: Object,
  offerOptions?: Object,
  answerOptions?: Object,
  sdpTransform?: <T>(sdp: T) => T,
  stream?: boolean,
  streams?: any[],
  objectMode?: boolean
}

export interface WebRTCDirectListenerOptions extends ListenerOptions{
  peerOptions?: SimplePeerOptions
}

export interface WebRTCDirectDialOptions extends AbortOptions{
  peerOptions?: SimplePeerOptions
}

export class WebRTCDirect implements Transport<AbortOptions, ListenerOptions> {
  private readonly _upgrader: Upgrader

  constructor (options: {upgrader: Upgrader}) {
    const { upgrader } = options

    if (upgrader == null) {
      throw new Error('An upgrader must be provided. See https://github.com/libp2p/interface-transport#upgrader.')
    }

    this._upgrader = upgrader
  }

  async dial (ma: Multiaddr, options: WebRTCDirectDialOptions = {}) {
    const socket = await this._connect(ma, options)
    const maConn = toMultiaddrConnection(socket, {remoteAddr: ma, signal: options.signal})
    log('new outbound connection %s', maConn.remoteAddr)
    const conn = await this._upgrader.upgradeOutbound(maConn)
    log('outbound connection %s upgraded', maConn.remoteAddr)
    return conn
  }

  async _connect (ma: Multiaddr, options:WebRTCDirectDialOptions = {}) {
    if (options.signal && options.signal.aborted) {
      throw new AbortError()
    }

    const peerOptions = {
      initiator: true,
      trickle: false,
      wrtc: isNode ? wrtc : undefined,
      ...options?.peerOptions
    }

    return new Promise((resolve, reject) => {
      const start = Date.now()
      let connected: boolean

      const cOpts = ma.toOptions()
      log('Dialing %s:%s', cOpts.host, cOpts.port)

      const channel = new SimplePeer(peerOptions)

      const onError = (err: Error) => {
        if (!connected) {
          const msg = `connection error ${cOpts.host}:${cOpts.port}: ${err.message}`

          log.error(msg)
          err.message = msg
          done(err)
        }
      }

      const onTimeout = () => {
        log('connnection timeout %s:%s', cOpts.host, cOpts.port)
        const err = errcode(new Error(`connection timeout after ${Date.now() - start}ms`), 'ERR_CONNECT_TIMEOUT')
        // Note: this will result in onError() being called
        channel.emit('error', err)
      }

      const onConnect = () => {
        connected = true

        log('connection opened %s:%s', cOpts.host, cOpts.port)
        done(null)
      }

      const onAbort = () => {
        log.error('connection aborted %s:%s', cOpts.host, cOpts.port)
        channel.destroy()
        done(new AbortError())
      }

      const done = (err: Error | null) => {
        channel.removeListener('error', onError)
        channel.removeListener('timeout', onTimeout)
        channel.removeListener('connect', onConnect)
        channel.removeAllListeners('signal')
        options.signal && options.signal.removeEventListener('abort', onAbort)

        err ? reject(err) : resolve(channel)
      }

      channel.once('error', onError)
      channel.once('timeout', onTimeout)
      channel.once('connect', onConnect)
      channel.on('close', () => channel.destroy())
      options.signal && options.signal.addEventListener('abort', onAbort)

      channel.on('signal', async (signal) => {
        const signalStr = JSON.stringify(signal)
        const url = 'http://' + cOpts.host + ':' + cOpts.port
        const path = '/?signal=' + base58btc.encode(fromString(signalStr))
        const uri = url + path

        try {
          const res = await fetch(uri)
          const incSignalBuf = base58btc.decode(await res.text())
          const incSignalStr = toString(incSignalBuf)
          const incSignal = JSON.parse(incSignalStr)
          channel.signal(incSignal)
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  /**
   * Creates a WebrtcDirect listener. The provided `handler` function will be called
   * anytime a new incoming Connection has been successfully upgraded via
   * `upgrader.upgradeInbound`.
   */
  createListener (options?: WebRTCDirectListenerOptions): Listener {
    if (!isNode) {
      throw errcode(new Error('Can\'t listen if run from the Browser'), 'ERR_NO_SUPPORT_FROM_BROWSER')
    }

    return createListener(this._upgrader, options)
  }

  /**
   * Takes a list of `Multiaddr`s and returns only valid addresses
   */
  filter (multiaddrs: Multiaddr[]): Multiaddr[] {
    multiaddrs = Array.isArray(multiaddrs) ? multiaddrs : [multiaddrs]

    return multiaddrs.filter((ma) => {
      if (ma.protoCodes().includes(CODE_CIRCUIT)) {
        return false
      }

      return mafmt.WebRTCDirect.matches(ma.decapsulateCode(CODE_P2P))
    })
  }
}
