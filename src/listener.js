'use strict'

const http = require('http')
const EventEmitter = require('events')
const debug = require('debug')
const log = debug('libp2p:webrtcdirect:listener')
log.error = debug('libp2p:webrtcdirect:listener:error')

const isNode = require('detect-node')
const wrtc = require('wrtc')
const SimplePeer = require('libp2p-webrtc-peer')
const { base58btc } = require('multiformats/bases/base58')
const { toString } = require('uint8arrays/to-string')
const { fromString } = require('uint8arrays/from-string')
const toMultiaddr = require('libp2p-utils/src/ip-port-to-multiaddr')

const toConnection = require('./socket-to-conn')

module.exports = ({ handler, upgrader }, options = {}) => {
  const listener = new EventEmitter()
  const server = http.createServer()

  let maSelf

  // Keep track of open connections to destroy in case of timeout
  listener.__connections = []

  server.on('request', async (req, res) => {
    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Access-Control-Allow-Origin', '*')

    const path = req.url
    const incSignalStr = path.split('?signal=')[1]
    const incSignalBuf = base58btc.decode(incSignalStr)
    const incSignal = JSON.parse(toString(incSignalBuf))

    options = {
      trickle: false,
      wrtc: isNode ? wrtc : undefined,
      ...options
    }

    const channel = new SimplePeer(options)

    const maConn = toConnection(channel, {
      remoteAddr: toMultiaddr(req.connection.remoteAddress, req.connection.remotePort)
    })
    log('new inbound connection %s', maConn.remoteAddr)

    channel.on('error', (err) => {
      log.error(`incoming connectioned errored with ${err}`)
    })
    channel.once('close', () => {
      channel.removeAllListeners('error')
    })
    channel.on('signal', (signal) => {
      const signalStr = JSON.stringify(signal)
      const signalEncoded = base58btc.encode(fromString(signalStr))
      res.end(Buffer.from(signalEncoded))
    })

    channel.signal(incSignal)

    let conn
    try {
      conn = await upgrader.upgradeInbound(maConn)
    } catch (err) {
      log.error('inbound connection failed to upgrade', err)
      return maConn.close()
    }
    log('inbound connection %s upgraded', maConn.remoteAddr)

    trackConn(listener, maConn)

    channel.on('connect', () => {
      listener.emit('connection', conn)
      handler(conn)

      channel.removeAllListeners('connect')
      channel.removeAllListeners('signal')
    })
  })

  server.on('error', (err) => listener.emit('error', err))
  server.on('close', () => listener.emit('close'))

  listener.listen = (ma) => {
    maSelf = ma
    const lOpts = ma.toOptions()

    return new Promise((resolve, reject) => {
      server.on('listening', (err) => {
        if (err) {
          return reject(err)
        }

        listener.emit('listening')
        log('Listening on %s %s', lOpts.port, lOpts.host)
        resolve()
      })

      server.listen(lOpts)
    })
  }

  listener.close = async () => {
    if (!server.listening) {
      return
    }

    await Promise.all(listener.__connections.map(c => c.close()))
    return new Promise((resolve, reject) => {
      server.close((err) => err ? reject(err) : resolve())
    })
  }

  listener.getAddrs = () => {
    return [maSelf]
  }

  return listener
}

function trackConn (listener, maConn) {
  listener.__connections.push(maConn)

  const untrackConn = () => {
    listener.__connections = listener.__connections.filter(c => c !== maConn)
  }

  maConn.conn.once('close', untrackConn)
}
