'use strict'

const SimplePeer = require('simple-peer')
const toPull = require('stream-to-pull-stream')
const Connection = require('interface-connection').Connection
const mafmt = require('mafmt')
const multibase = require('multibase')
const multiaddr = require('multiaddr')
const once = require('once')
const request = require('xhr')

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

    const channel = new SimplePeer(options)
    const conn = new Connection(toPull.duplex(channel))

    let connected = false

    channel.on('signal', (signal) => {
      const signalStr = JSON.stringify(signal)
      const cma = cleanMultiaddr(ma)
      const url = 'http://' + cma.toOptions().host + ':' + cma.toOptions().port
      const path = '/?signal=' + multibase.encode('base58btc', new Buffer(signalStr))
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
    throw new Error(`Can't listen if run from the Browser`)
  }

  filter (multiaddrs) {
    if (!Array.isArray(multiaddrs)) {
      multiaddrs = [multiaddrs]
    }
    return multiaddrs.filter((ma) => {
      return mafmt.WebRTCDirect.matches(ma)
    })
  }
}

module.exports = WebRTCDirect

function noop () {}

function cleanMultiaddr (ma) {
  return multiaddr(ma.toString().split('/').slice(2).join('/'))
}
