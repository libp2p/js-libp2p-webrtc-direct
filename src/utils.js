'use strict'

const isNode = require('detect-node')

module.exports.getWrtc = () => {
  let wrtc
  if (isNode) {
    // wrtc might have environment issues and this requires it inline to work around them
    let wrtcNode
    try { wrtcNode = require('wrtc') } catch (_) { }
    wrtc = wrtcNode
  }
  return wrtc
}
