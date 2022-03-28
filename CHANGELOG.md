## [1.0.0](https://github.com/libp2p/js-libp2p-webrtc-direct/compare/v0.7.1...v1.0.0) (2022-03-28)


### ⚠ BREAKING CHANGES

* this module is now ESM-only

Co-authored-by: achingbrain <alex@achingbrain.net>

### Features

* convert to typescript ([#151](https://github.com/libp2p/js-libp2p-webrtc-direct/issues/151)) ([85ce5cf](https://github.com/libp2p/js-libp2p-webrtc-direct/commit/85ce5cf49afcdb788212e250673e8e4f8609055d))


### Bug Fixes

* add 'node-pre-gyp' installation to 'check' and 'test-node' actions ([#152](https://github.com/libp2p/js-libp2p-webrtc-direct/issues/152)) ([bf4a68b](https://github.com/libp2p/js-libp2p-webrtc-direct/commit/bf4a68b9e4a159bb6a4d73a92b11a6cfdb140178))


### Trivial Changes

* add note about `node-pre-gyp` to readme.md ([#141](https://github.com/libp2p/js-libp2p-webrtc-direct/issues/141)) ([ab4cc82](https://github.com/libp2p/js-libp2p-webrtc-direct/commit/ab4cc825d75801972b8c33e37ffca28796b9a1aa)), closes [#140](https://github.com/libp2p/js-libp2p-webrtc-direct/issues/140)
* **deps-dev:** bump aegir from 35.2.1 to 36.0.0 ([#139](https://github.com/libp2p/js-libp2p-webrtc-direct/issues/139)) ([720cfad](https://github.com/libp2p/js-libp2p-webrtc-direct/commit/720cfadaea310c84feb3fe9eecc005ed53e1b95f))
* replace Travis with Github Actions ([#150](https://github.com/libp2p/js-libp2p-webrtc-direct/issues/150)) ([a73735b](https://github.com/libp2p/js-libp2p-webrtc-direct/commit/a73735b80bb32d4f4618e5071abfd17f90679ee1))
* update project config ([13ab340](https://github.com/libp2p/js-libp2p-webrtc-direct/commit/13ab340c9733c8ac0d134e4735a177722780bd27))
* update Readme ([#148](https://github.com/libp2p/js-libp2p-webrtc-direct/issues/148)) ([ba9facb](https://github.com/libp2p/js-libp2p-webrtc-direct/commit/ba9facb708d5f802d0c9010fa3d1351f9a6a11f8))

## [0.7.1](https://github.com/libp2p/js-libp2p-webrtc-direct/compare/v0.7.0...v0.7.1) (2021-09-20)



# [0.7.0](https://github.com/libp2p/js-libp2p-webrtc-direct/compare/v0.6.0...v0.7.0) (2021-07-09)


### chore

* update deps ([#128](https://github.com/libp2p/js-libp2p-webrtc-direct/issues/128)) ([d574b7d](https://github.com/libp2p/js-libp2p-webrtc-direct/commit/d574b7df1fa40250ef7ead448d362fd55a6eb974))


### BREAKING CHANGES

* uses new peer id, multiaddr, etc



# [0.6.0](https://github.com/libp2p/js-libp2p-webrtc-direct/compare/v0.5.1...v0.6.0) (2021-04-13)



## [0.5.1](https://github.com/libp2p/js-libp2p-webrtc-direct/compare/v0.5.0...v0.5.1) (2021-02-05)


### Bug Fixes

* lint ([3490d36](https://github.com/libp2p/js-libp2p-webrtc-direct/commit/3490d3635c0167f3090925a68cc0b3cb78acb062))



# [0.5.0](https://github.com/libp2p/js-libp2p-webrtc-direct/compare/v0.4.1...v0.5.0) (2021-01-22)


### Bug Fixes

* add remote addr on listener connection ([#97](https://github.com/libp2p/js-libp2p-webrtc-direct/issues/97)) ([c562a0d](https://github.com/libp2p/js-libp2p-webrtc-direct/commit/c562a0d47288bcbb3cdb0fb1118a0899903f811b))



<a name="0.4.1"></a>
## [0.4.1](https://github.com/libp2p/js-libp2p-webrtc-direct/compare/v0.4.0...v0.4.1) (2020-12-11)


### Bug Fixes

* transport should not handle connection if upgradeInbound throws ([#32](https://github.com/libp2p/js-libp2p-webrtc-direct/issues/32)) ([1711a7d](https://github.com/libp2p/js-libp2p-webrtc-direct/commit/1711a7d))



<a name="0.4.0"></a>
# [0.4.0](https://github.com/libp2p/js-libp2p-webrtc-direct/compare/v0.3.1...v0.4.0) (2019-10-02)


### Code Refactoring

* switch to async iterators ([#30](https://github.com/libp2p/js-libp2p-webrtc-direct/issues/30)) ([4def4aa](https://github.com/libp2p/js-libp2p-webrtc-direct/commit/4def4aa))


### BREAKING CHANGES

* Switch to using async/await and async iterators. The transport and connection interfaces have changed.



<a name="0.3.1"></a>
## [0.3.1](https://github.com/libp2p/js-libp2p-webrtc-direct/compare/v0.3.0...v0.3.1) (2018-09-26)


### Bug Fixes

* options no longer ignored in createListener ([#23](https://github.com/libp2p/js-libp2p-webrtc-direct/issues/23)) ([6dd29ed](https://github.com/libp2p/js-libp2p-webrtc-direct/commit/6dd29ed))



<a name="0.3.0"></a>
# [0.3.0](https://github.com/libp2p/js-libp2p-webrtc-direct/compare/v0.2.0...v0.3.0) (2018-04-05)


### Features

* add class-is module ([78c70ff](https://github.com/libp2p/js-libp2p-webrtc-direct/commit/78c70ff))
* skip p2p-circuit addresses ([#15](https://github.com/libp2p/js-libp2p-webrtc-direct/issues/15)) ([914f006](https://github.com/libp2p/js-libp2p-webrtc-direct/commit/914f006))



<a name="0.2.0"></a>
# [0.2.0](https://github.com/libp2p/js-libp2p-webrtc-direct/compare/v0.1.1...v0.2.0) (2017-09-03)


### Features

* p2p addrs situation ([#14](https://github.com/libp2p/js-libp2p-webrtc-direct/issues/14)) ([f5f8a21](https://github.com/libp2p/js-libp2p-webrtc-direct/commit/f5f8a21))



<a name="0.1.1"></a>
## [0.1.1](https://github.com/libp2p/js-libp2p-webrtc-direct/compare/v0.1.0...v0.1.1) (2017-01-16)



<a name="0.1.0"></a>
# [0.1.0](https://github.com/libp2p/js-libp2p-webrtc-direct/compare/8a5d975...v0.1.0) (2017-01-16)


### Features

* v0.1.0 ([8a5d975](https://github.com/libp2p/js-libp2p-webrtc-direct/commit/8a5d975))
