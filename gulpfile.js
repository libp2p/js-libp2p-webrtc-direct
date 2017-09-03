'use strict'

const gulp = require('gulp')
const WebRTCDirect = require('./src')
const pull = require('pull-stream')
const multiaddr = require('multiaddr')

gulp.task('test:node:before', boot)
gulp.task('test:node:after', shutdown)
gulp.task('test:browser:before', boot)
gulp.task('test:browser:after', shutdown)

const ma = multiaddr('/ip4/127.0.0.1/tcp/12345/http/p2p-webrtc-direct')
let listener

function boot (done) {
  const wd = new WebRTCDirect()
  listener = wd.createListener((conn) => pull(conn, conn))
  listener.listen(ma, done)
  listener.on('listening', () => {
    console.log('gulp listener started on:', ma.toString())
  })
}

function shutdown (done) {
  listener.close(done)
}

require('aegir/gulp')(gulp)
