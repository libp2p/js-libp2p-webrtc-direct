import { logger } from '@libp2p/logger'
import * as mafmt from '@multiformats/mafmt'
import { base58btc } from 'multiformats/bases/base58'
import { fetch } from 'native-fetch'
import { AbortError } from 'abortable-iterator'
import { toString } from 'uint8arrays/to-string'
import { fromString } from 'uint8arrays/from-string'
import { CODE_CIRCUIT, CODE_P2P } from './constants.js'
import { toMultiaddrConnection } from './socket-to-conn.js'
import { createListener } from './listener.js'
import { Signal, WebRTCInitiator, WebRTCInitiatorInit, WebRTCReceiverInit, WRTC } from '@libp2p/webrtc-peer'
import { symbol } from '@libp2p/interface-transport'
import type { CreateListenerOptions, DialOptions, Listener, Transport } from '@libp2p/interface-transport'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { Connection } from '@libp2p/interface-connection'

const log = logger('libp2p:webrtc-direct')

export interface WebRTCDirectInit {
  wrtc?: WRTC
  initiatorOptions?: WebRTCInitiatorInit
  recieverOptions?: WebRTCReceiverInit
}

class WebRTCDirect implements Transport {
  private readonly initiatorOptions?: WebRTCInitiatorInit
  private readonly recieverOptions?: WebRTCReceiverInit
  public wrtc?: WRTC

  constructor (init?: WebRTCDirectInit) {
    this.initiatorOptions = init?.initiatorOptions
    this.recieverOptions = init?.recieverOptions
    this.wrtc = init?.wrtc
  }

  get [symbol] (): true {
    return true
  }

  get [Symbol.toStringTag] (): string {
    return '@libp2p/webrtc-direct'
  }

  async dial (ma: Multiaddr, options: DialOptions): Promise<Connection> {
    const socket = await this._connect(ma, options)
    const maConn = toMultiaddrConnection(socket, { remoteAddr: ma, signal: options.signal })
    log('new outbound connection %s', maConn.remoteAddr)
    const conn = await options.upgrader.upgradeOutbound(maConn)
    log('outbound connection %s upgraded', maConn.remoteAddr)
    return conn
  }

  async _connect (ma: Multiaddr, options: DialOptions): Promise<WebRTCInitiator> {
    if (options.signal?.aborted === true) {
      throw new AbortError()
    }

    const channelOptions = {
      initiator: true,
      trickle: false,
      ...this.initiatorOptions
    }

    // Use custom WebRTC implementation
    if (this.wrtc != null) {
      channelOptions.wrtc = this.wrtc
    }

    return await new Promise<WebRTCInitiator>((resolve, reject) => {
      let connected: boolean

      const cOpts = ma.toOptions()
      log('Dialing %s:%s', cOpts.host, cOpts.port)

      const channel = new WebRTCInitiator(channelOptions)

      const onError = (evt: CustomEvent<Error>): void => {
        const err = evt.detail

        if (!connected) {
          const msg = `connection error ${cOpts.host}:${cOpts.port}: ${err.message}`

          log.error(msg)
          err.message = msg
          done(err)
        }
      }

      const onReady = (): void => {
        connected = true

        log('connection opened %s:%s', cOpts.host, cOpts.port)
        done()
      }

      const onAbort = (): void => {
        log.error('connection aborted %s:%s', cOpts.host, cOpts.port)
        void channel.close().finally(() => {
          done(new AbortError())
        })
      }

      const done = (err?: Error): void => {
        channel.removeEventListener('error', onError)
        channel.removeEventListener('ready', onReady)
        options.signal?.removeEventListener('abort', onAbort)

        if (err != null) {
          reject(err)
        } else {
          resolve(channel)
        }
      }

      channel.addEventListener('error', onError, {
        once: true
      })
      channel.addEventListener('ready', onReady, {
        once: true
      })
      channel.addEventListener('close', () => {
        channel.removeEventListener('error', onError)
      })
      options.signal?.addEventListener('abort', onAbort)

      const onSignal = async (signal: Signal): Promise<void> => {
        if (signal.type !== 'offer') {
          // skip candidates, just send the offer as it includes the candidates
          return
        }

        const signalStr = JSON.stringify(signal)

        let host = cOpts.host

        if (cOpts.family === 6 && !host.startsWith('[')) {
          host = `[${host}]`
        }

        const url = `http://${host}:${cOpts.port}`
        const path = `/?signal=${base58btc.encode(fromString(signalStr))}`
        const uri = url + path

        try {
          const res = await fetch(uri)
          const body = await res.text()

          if (body.trim() === '') {
            // no response to this signal
            return
          }

          const incSignalBuf = base58btc.decode(body)
          const incSignalStr = toString(incSignalBuf)
          const incSignal = JSON.parse(incSignalStr)

          channel.handleSignal(incSignal)
        } catch (err: any) {
          await channel.close(err)
          reject(err)
        }
      }

      channel.addEventListener('signal', (evt) => {
        const signal = evt.detail

        void onSignal(signal).catch(async err => {
          await channel.close(err)
        })
      })
    })
  }

  /**
   * Creates a WebrtcDirect listener. The provided `handler` function will be called
   * anytime a new incoming Connection has been successfully upgraded via
   * `upgrader.upgradeInbound`.
   */
  createListener (options: CreateListenerOptions): Listener {
    return createListener({
      ...options,
      receiverOptions: this.recieverOptions,
      wrtc: this.wrtc
    })
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

      return mafmt.P2PWebRTCDirect.matches(ma.decapsulateCode(CODE_P2P))
    })
  }
}

export function webRTCDirect (init: WebRTCDirectInit = {}): () => Transport {
  return () => new WebRTCDirect(init)
}
