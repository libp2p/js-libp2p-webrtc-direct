import http from 'http'
import { logger } from '@libp2p/logger'
import { base58btc } from 'multiformats/bases/base58'
import { toString } from 'uint8arrays/to-string'
import { fromString } from 'uint8arrays/from-string'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { IncomingMessage, ServerResponse } from 'http'
import { EventEmitter, CustomEvent } from '@libp2p/interfaces/events'
import type { MultiaddrConnection, Connection } from '@libp2p/interface-connection'
import type { Listener, CreateListenerOptions, ConnectionHandler, ListenerEvents, Upgrader } from '@libp2p/interface-transport'
import { ipPortToMultiaddr } from '@libp2p/utils/ip-port-to-multiaddr'
import { toMultiaddrConnection } from './socket-to-conn.js'
import { Signal, WebRTCReceiver, WebRTCReceiverInit, WRTC } from '@libp2p/webrtc-peer'
import errCode from 'err-code'
import { pEvent } from 'p-event'

const log = logger('libp2p:webrtc-direct:listener')

interface WebRTCDirectListenerOptions extends CreateListenerOptions {
  receiverOptions?: WebRTCReceiverInit
  wrtc?: WRTC
}

interface WebRTCDirectServerEvents {
  'error': CustomEvent<Error>
  'listening': CustomEvent
  'connection': CustomEvent<MultiaddrConnection>
}

class WebRTCDirectServer extends EventEmitter<WebRTCDirectServerEvents> {
  private readonly server: http.Server
  private readonly wrtc?: WRTC
  private readonly receiverOptions?: WebRTCReceiverInit
  private connections: MultiaddrConnection[]
  private channels: WebRTCReceiver[]

  constructor (multiaddr: Multiaddr, wrtc?: WRTC, receiverOptions?: WebRTCReceiverInit) {
    super()

    this.connections = []
    this.channels = []
    this.wrtc = wrtc
    this.receiverOptions = receiverOptions
    this.server = http.createServer()

    this.server.on('request', (req: IncomingMessage, res: ServerResponse) => {
      void this.processRequest(req, res).catch(err => {
        log.error(err)
      })
    })

    this.server.on('error', (err) => this.dispatchEvent(new CustomEvent<Error>('error', { detail: err })))

    const lOpts = multiaddr.toOptions()

    this.server.on('listening', (err: Error) => {
      if (err != null) {
        this.dispatchEvent(new CustomEvent<Error>('error', { detail: err }))

        return
      }

      this.dispatchEvent(new CustomEvent('listening'))
      log('Listening on %s %s', lOpts.port, lOpts.host)
    })

    this.server.listen(lOpts)
  }

  async processRequest (req: IncomingMessage, res: ServerResponse): Promise<void> {
    const remoteAddress = req?.socket?.remoteAddress
    const remotePort = req?.socket.remotePort
    const remoteHost = req.headers.host
    const requestUrl = req.url

    if (remoteAddress == null || remotePort == null || requestUrl == null || remoteHost == null) {
      const err = new Error('Invalid listener request. Specify request\'s url, remoteAddress, remotePort.')
      log.error(err)
      res.writeHead(500)
      res.end(err)
      return
    }
    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Access-Control-Allow-Origin', '*')

    const url = new URL(requestUrl, `http://${remoteHost}`)
    const incSignalStr = url.searchParams.get('signal')

    if (incSignalStr == null) {
      const err = new Error('Invalid listener request. Signal not found.')
      log.error(err)
      res.writeHead(500)
      res.end(err)
      return
    }

    const incSignalBuf = base58btc.decode(incSignalStr)
    const incSignal: Signal = JSON.parse(toString(incSignalBuf))

    if (incSignal.type !== 'offer') {
      // offers contain candidates so only respond to the offer
      res.end()
      return
    }

    const channel = new WebRTCReceiver({
      wrtc: this.wrtc,
      ...this.receiverOptions
    })
    this.channels.push(channel)

    channel.addEventListener('signal', (evt) => {
      const signal = evt.detail
      const signalStr = JSON.stringify(signal)
      const signalEncoded = base58btc.encode(fromString(signalStr))

      res.end(signalEncoded)
    })
    channel.addEventListener('error', (evt) => {
      const err = evt.detail

      log.error('incoming connection errored with', err)
      res.end()
      void channel.close().catch(err => {
        log.error(err)
      })
    })
    channel.addEventListener('ready', () => {
      const maConn = toMultiaddrConnection(channel, {
        remoteAddr: ipPortToMultiaddr(remoteAddress, remotePort)
      })
      log('new inbound connection %s', maConn.remoteAddr)

      this.connections.push(maConn)

      const untrackConn = (): void => {
        this.connections = this.connections.filter(c => c !== maConn)
        this.channels = this.channels.filter(c => c !== channel)
      }

      channel.addEventListener('close', untrackConn, {
        once: true
      })

      this.dispatchEvent(new CustomEvent('connection', { detail: maConn }))
    })

    channel.handleSignal(incSignal)
  }

  async close (): Promise<void> {
    await Promise.all(
      this.channels.map(async channel => { await channel.close() })
    )

    await new Promise<void>((resolve, reject) => {
      this.server.close((err) => {
        if (err != null) {
          reject(err); return
        }

        resolve()
      })
    })
  }
}

class WebRTCDirectListener extends EventEmitter<ListenerEvents> implements Listener {
  private server?: WebRTCDirectServer
  private multiaddr?: Multiaddr
  private readonly wrtc?: WRTC
  private readonly receiverOptions?: WebRTCReceiverInit
  private readonly handler?: ConnectionHandler
  private readonly upgrader: Upgrader

  constructor (upgrader: Upgrader, wrtc?: WRTC, receiverOptions?: WebRTCReceiverInit, handler?: ConnectionHandler) {
    super()

    this.upgrader = upgrader
    this.wrtc = wrtc
    this.receiverOptions = receiverOptions
    this.handler = handler
  }

  async listen (multiaddr: Multiaddr): Promise<void> {
    // Should only be used if not already listening
    if (this.multiaddr != null) {
      throw errCode(new Error('listener already in use'), 'ERR_ALREADY_LISTENING')
    }

    this.multiaddr = multiaddr
    const server = new WebRTCDirectServer(multiaddr, this.wrtc, this.receiverOptions)
    this.server = server

    this.server.addEventListener('connection', (evt) => {
      void this.onConnection(evt.detail).catch(err => {
        log.error(err)
      })
    })

    await pEvent(server, 'listening')

    this.dispatchEvent(new CustomEvent('listening'))
  }

  async onConnection (maConn: MultiaddrConnection): Promise<void> {
    let connection: Connection

    try {
      connection = await this.upgrader.upgradeInbound(maConn)
    } catch (err) {
      log.error('inbound connection failed to upgrade', err)
      await maConn.close(); return
    }
    log('inbound connection %s upgraded', maConn.remoteAddr)

    if (this.handler != null) {
      this.handler(connection)
    }

    this.dispatchEvent(new CustomEvent<Connection>('connection', { detail: connection }))
  }

  async close (): Promise<void> {
    if (this.server != null) {
      await this.server.close()
    }

    this.dispatchEvent(new CustomEvent('close'))
  }

  getAddrs (): Multiaddr[] {
    if (this.multiaddr != null) {
      return [this.multiaddr]
    }

    return []
  }
}

export function createListener (options: WebRTCDirectListenerOptions): Listener {
  return new WebRTCDirectListener(options.upgrader, options.wrtc, options.receiverOptions, options.handler)
}
