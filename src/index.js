'use strict'

const assert = require('debug')
const debug = require('debug')
const log = debug('libp2p:webrtcdirect')
const errcode = require('err-code')

const wrtc = require('wrtc')
const SimplePeer = require('simple-peer')
const isNode = require('detect-node')
const mafmt = require('mafmt')
const multibase = require('multibase')
const request = require('request')
const withIs = require('class-is')
const { AbortError } = require('abortable-iterator')

const { CODE_CIRCUIT, CODE_P2P } = require('./constants')
const toConnection = require('./socket-to-conn')
const createListener = require('./listener')

function noop () {}

/**
 * @class WebRTCDirect
 */
class WebRTCDirect {
  /**
   * @constructor
   * @param {object} options
   * @param {Upgrader} options.upgrader
   */
  constructor ({ upgrader }) {
    assert(upgrader, 'An upgrader must be provided. See https://github.com/libp2p/interface-transport#upgrader.')
    this._upgrader = upgrader
  }

  /**
   * @async
   * @param {Multiaddr} ma
   * @param {object} options
   * @param {AbortSignal} options.signal Used to abort dial requests
   * @returns {Connection} An upgraded Connection
   */
  async dial (ma, options = {}) {
    const socket = await this._connect(ma, options)
    const maConn = toConnection(socket, { remoteAddr: ma, signal: options.signal })
    log('new outbound connection %s', maConn.remoteAddr)
    const conn = await this._upgrader.upgradeOutbound(maConn)
    log('outbound connection %s upgraded', maConn.remoteAddr)
    return conn
  }

  /**
   * @private
   * @param {Multiaddr} ma
   * @param {object} options
   * @param {AbortSignal} options.signal Used to abort dial requests
   * @returns {Promise<SimplePeer>} Resolves a SimplePeer Webrtc channel
   */
  _connect (ma, options = {}) {
    if (options.signal && options.signal.aborted) {
      throw new AbortError()
    }

    options = {
      ...options,
      initiator: true,
      trickle: false,
      wrtc: isNode ? wrtc : undefined
    }

    return new Promise((resolve, reject) => {
      const start = Date.now()
      let connected

      const cOpts = ma.toOptions()
      log('Dialing %s:%s', cOpts.host, cOpts.port)

      const channel = new SimplePeer(options)

      const onError = (err) => {
        if (!connected) {
          err.message = `connection error ${cOpts.host}:${cOpts.port}: ${err.message}`
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
        log('connection aborted %s:%s', cOpts.host, cOpts.port)
        channel.destroy()
        done(new AbortError())
      }

      const done = (err) => {
        channel.removeListener('error', onError)
        channel.removeListener('timeout', onTimeout)
        channel.removeListener('connect', onConnect)
        options.signal && options.signal.removeEventListener('abort', onAbort)

        err ? reject(err) : resolve(channel)
      }

      channel.once('error', onError)
      channel.once('timeout', onTimeout)
      channel.once('connect', onConnect)
      channel.on('close', () => channel.destroy())
      options.signal && options.signal.addEventListener('abort', onAbort)

      channel.on('signal', (signal) => {
        const signalStr = JSON.stringify(signal)
        const url = 'http://' + cOpts.host + ':' + cOpts.port
        const path = '/?signal=' + multibase.encode('base58btc', Buffer.from(signalStr))
        const uri = url + path

        request.get(uri, (err, res) => {
          if (err) {
            return reject(err)
          }
          const incSignalBuf = multibase.decode(res.body)
          const incSignalStr = incSignalBuf.toString()
          const incSignal = JSON.parse(incSignalStr)
          channel.signal(incSignal)
        })
      })
    })
  }

  /**
   * Creates a WebrtcDirect listener. The provided `handler` function will be called
   * anytime a new incoming Connection has been successfully upgraded via
   * `upgrader.upgradeInbound`.
   * @param {*} [options]
   * @param {function(Connection)} handler
   * @returns {Listener} A WebrtcDirect listener
   */
  createListener (options = {}, handler) {
    if (!isNode) {
      throw errcode(new Error('Can\'t listen if run from the Browser'), 'ERR_NO_SUPPORT_FROM_BROWSER')
    }

    if (typeof options === 'function') {
      handler = options
      options = {}
    }

    handler = handler || noop

    return createListener({ handler, upgrader: this._upgrader }, options)
  }

  /**
   * Takes a list of `Multiaddr`s and returns only valid addresses
   * @param {Multiaddr[]} multiaddrs
   * @returns {Multiaddr[]} Valid multiaddrs
   */
  filter (multiaddrs) {
    multiaddrs = Array.isArray(multiaddrs) ? multiaddrs : [multiaddrs]

    return multiaddrs.filter((ma) => {
      if (ma.protoCodes().includes(CODE_CIRCUIT)) {
        return false
      }

      return mafmt.WebRTCDirect.matches(ma.decapsulateCode(CODE_P2P))
    })
  }
}

module.exports = withIs(WebRTCDirect, { className: 'WebRTCDirect', symbolName: '@libp2p/js-libp2p-webrtc-direct/webrtcdirect' })
