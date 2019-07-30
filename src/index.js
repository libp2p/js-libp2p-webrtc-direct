'use strict'

const wrtc = require('wrtc')
const SimplePeer = require('simple-peer')
const isNode = require('detect-node')
const http = require('http')
const toPull = require('stream-to-pull-stream')
const Connection = require('interface-connection').Connection
const EE = require('events').EventEmitter
const multiaddr = require('multiaddr')
const mafmt = require('mafmt')
const multibase = require('multibase')
const once = require('once')
const request = require('request')
const withIs = require('class-is')

function noop () {}

function cleanMultiaddr (ma) {
  return ma.decapsulate('/p2p-webrtc-direct')
}

class WebRTCDirect {
  dial (ma, options, callback) {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }

    callback = once(callback || noop)

    Object.assign(options, {
      initiator: true,
      trickle: false
    })

    if (isNode) {
      options.wrtc = wrtc
    }

    const channel = new SimplePeer(options)
    const conn = new Connection(toPull.duplex(channel))

    let connected = false

    channel.on('signal', (signal) => {
      const signalStr = JSON.stringify(signal)
      const cma = cleanMultiaddr(ma)
      const url = 'http://' + cma.toOptions().host + ':' + cma.toOptions().port
      const path = '/?signal=' + multibase.encode('base58btc', Buffer.from(signalStr))
      const uri = url + path

      request.get(uri, (err, res) => {
        if (err) {
          return callback(err)
        }
        const incSignalBuf = multibase.decode(res.body)
        const incSignalStr = incSignalBuf.toString()
        const incSignal = JSON.parse(incSignalStr)
        channel.signal(incSignal)
      })
    })

    channel.on('connect', () => {
      connected = true
      callback(null, conn)
    })

    conn.destroy = channel.destroy.bind(channel)
    conn.getObservedAddrs = (callback) => callback(null, [ma])

    channel.on('timeout', () => callback(new Error('timeout')))
    channel.on('close', () => conn.destroy())
    channel.on('error', (err) => {
      if (!connected) {
        callback(err)
      }
    })
  }

  createListener (options, handler) {
    if (!isNode) {
      throw new Error(`Can't listen if run from the Browser`)
    }

    if (typeof options === 'function') {
      handler = options
      options = {}
    }

    const listener = new EE()
    const server = http.createServer()
    let maSelf

    server.on('request', (req, res) => {
      res.setHeader('Content-Type', 'text/plain')
      res.setHeader('Access-Control-Allow-Origin', '*')

      const path = req.url
      const incSignalStr = path.split('?signal=')[1]
      const incSignalBuf = multibase.decode(Buffer.from(incSignalStr))
      const incSignal = JSON.parse(incSignalBuf.toString())

      Object.assign(options, {
        trickle: false
      })

      if (isNode) {
        options.wrtc = wrtc
      }

      const channel = new SimplePeer(options)
      const conn = new Connection(toPull.duplex(channel))

      channel.on('connect', () => {
        conn.getObservedAddrs = (callback) => callback(null, [])
        listener.emit('connection', conn)
        handler(conn)
      })

      channel.on('signal', (signal) => {
        const signalStr = JSON.stringify(signal)
        const signalEncoded = multibase.encode('base58btc', Buffer.from(signalStr))
        res.end(signalEncoded.toString())
      })

      channel.signal(incSignal)
    })

    listener.listen = (ma, callback) => {
      callback = callback || noop
      console.log('listen', ma.toString())
      maSelf = ma
      server.on('listening', () => {
        listener.emit('listening')
        callback()
      })

      const cma = cleanMultiaddr(ma)
      server.listen(cma.toOptions())
    }

    listener.close = (options, callback) => {
      if (typeof options === 'function') {
        callback = options
        options = {}
      }

      callback = callback || noop

      server.close(() => {
        listener.emit('close')
        callback()
      })
    }

    listener.getAddrs = (callback) => {
      setImmediate(() => {
        callback(null, [maSelf])
      })
    }

    return listener
  }

  filter (multiaddrs) {
    if (!Array.isArray(multiaddrs)) {
      multiaddrs = [multiaddrs]
    }

    return multiaddrs.filter((ma) => {
      if (ma.protoNames().indexOf('p2p-circuit') > -1) {
        return false
      }

      // If the /p2p (421) proto name is included, get rid of it
      if (ma.protoCodes().includes(421)) {
        ma = ma.decapsulate(multiaddr.protocols.codes[421].name)
      }

      return mafmt.WebRTCDirect.matches(ma)
    })
  }
}

module.exports = withIs(WebRTCDirect, { className: 'WebRTCDirect', symbolName: '@libp2p/js-libp2p-webrtc-direct/webrtcdirect' })
