"use strict";

function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
(function () {
  var state = {
    inPlayer: false,
    uiTimeout: null,
    playerFocusIndex: 0,
    // 0: Play, 1: Chat, 2: Quality, 3: Channel
    playerBtns: ['btn-play', 'btn-chat', 'btn-quality', 'btn-goto-channel'],
    isPlaying: true,
    isQualityMenuOpen: false,
    isChatOpen: false,
    qualityOptions: [],
    qualityFocusIndex: 0,
    currentStreamChannel: "",
    currentStreamId: "",
    currentStreamTitle: "",
    currentVideoUrl: "",
    bufferingWatchdog: null,
    retryCount: 0
  };
  App.modules.player = {
    init: function init() {
      // Player doesn't need heavy initial state reset like others since it re-initializes on open
    },
    load: function () {
      var _load = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
        return _regenerator().w(function (_context) {
          while (1) switch (_context.n) {
            case 0:
              return _context.a(2);
          }
        }, _callee);
      }));
      function load() {
        return _load.apply(this, arguments);
      }
      return load;
    }(),
    getStreamM3u8: function () {
      var _getStreamM3u = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(channel) {
        var gqlBody, headers, tokenRes, tokenData, _tokenData$data$strea, value, signature, originalUsherUrl, m3u8Url, m3u8Res, proxyUrl, m3u8Text, lines, streams, currentName, mediaMap, autoOption, otherOptions, _t, _t2;
        return _regenerator().w(function (_context2) {
          while (1) switch (_context2.p = _context2.n) {
            case 0:
              _context2.p = 0;
              // 1. Usa il client-id pubblico Web di Twitch per bypassare blocchi OAuth sullo streaming
              gqlBody = {
                operationName: 'PlaybackAccessToken_Template',
                query: "query PlaybackAccessToken_Template($login: String!, $playerType: String!) {  streamPlaybackAccessToken(channelName: $login, params: {platform: \"web\", playerBackend: \"mediaplayer\", playerType: $playerType}) { value signature } }",
                variables: {
                  login: channel,
                  playerType: 'site'
                }
              };
              headers = {
                'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
                'Content-Type': 'application/json'
              };
              _context2.n = 1;
              return fetch('https://gql.twitch.tv/gql', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(gqlBody)
              });
            case 1:
              tokenRes = _context2.v;
              _context2.n = 2;
              return tokenRes.json();
            case 2:
              tokenData = _context2.v;
              if (!(tokenData.errors && tokenData.errors.length > 0)) {
                _context2.n = 3;
                break;
              }
              throw new Error("GQL Error: " + tokenData.errors[0].message);
            case 3:
              if (!(!tokenData.data || !tokenData.data.streamPlaybackAccessToken)) {
                _context2.n = 4;
                break;
              }
              throw new Error("No token in GQL response");
            case 4:
              _tokenData$data$strea = tokenData.data.streamPlaybackAccessToken, value = _tokenData$data$strea.value, signature = _tokenData$data$strea.signature; // 2. Componi e Leggi il file M3U8 Master da Usher
              originalUsherUrl = "https://usher.ttvnw.net/api/channel/hls/".concat(channel, ".m3u8?allow_source=true&sig=").concat(signature, "&token=").concat(encodeURIComponent(value), "&reassignments_supported=true&playlist_include_framerate=true&p=").concat(Math.random());
              m3u8Url = originalUsherUrl; // --- AD BLOCK LOGIC CON FALLBACK ---
              if (!App.settings.adBlock) {
                _context2.n = 12;
                break;
              }
              _context2.p = 5;
              proxyUrl = "https://lb-eu.cdn-perfprod.com/live/".concat(channel, "?allow_source=true&sig=").concat(signature, "&token=").concat(encodeURIComponent(value), "&reassignments_supported=true&playlist_include_framerate=true");
              _context2.n = 6;
              return fetch(proxyUrl);
            case 6:
              m3u8Res = _context2.v;
              if (m3u8Res.ok) {
                _context2.n = 8;
                break;
              }
              console.warn("Ad-Block Proxy returned ".concat(m3u8Res.status, ", falling back..."));
              _context2.n = 7;
              return fetch(originalUsherUrl);
            case 7:
              m3u8Res = _context2.v;
            case 8:
              _context2.n = 11;
              break;
            case 9:
              _context2.p = 9;
              _t = _context2.v;
              console.warn("Ad-Block Proxy fetch failed, falling back to Usher:", _t);
              _context2.n = 10;
              return fetch(originalUsherUrl);
            case 10:
              m3u8Res = _context2.v;
            case 11:
              _context2.n = 14;
              break;
            case 12:
              _context2.n = 13;
              return fetch(originalUsherUrl);
            case 13:
              m3u8Res = _context2.v;
            case 14:
              if (m3u8Res.ok) {
                _context2.n = 15;
                break;
              }
              throw new Error("Usher HTTP ".concat(m3u8Res.status));
            case 15:
              _context2.n = 16;
              return m3u8Res.text();
            case 16:
              m3u8Text = _context2.v;
              // 3. Estrai le varianti (Risoluzioni)
              lines = m3u8Text.split('\n');
              streams = [{
                name: 'Auto',
                url: m3u8Url
              }];
              currentName = null;
              mediaMap = {};
              lines.forEach(function (line) {
                if (line.startsWith('#EXT-X-MEDIA:TYPE=VIDEO')) {
                  var groupIdMatch = line.match(/GROUP-ID="([^"]+)"/);
                  var nameMatch = line.match(/NAME="([^"]+)"/);
                  if (groupIdMatch && nameMatch) {
                    var cleanName = nameMatch[1].replace(/\(source\)/gi, '').trim();
                    mediaMap[groupIdMatch[1]] = cleanName;
                  }
                }
              });
              lines.forEach(function (line) {
                if (line.startsWith('#EXT-X-STREAM-INF')) {
                  var videoMatch = line.match(/VIDEO="([^"]+)"/);
                  var groupId = videoMatch ? videoMatch[1] : null;
                  currentName = groupId && mediaMap[groupId] ? mediaMap[groupId] : groupId || 'Unknown';
                } else if (line.startsWith('http') && currentName) {
                  streams.push({
                    name: currentName,
                    url: line
                  });
                  currentName = null;
                }
              });
              autoOption = streams[0];
              otherOptions = streams.slice(1);
              otherOptions.sort(function (a, b) {
                var getRes = function getRes(s) {
                  var m = s.name.match(/(\d+)p/);
                  return m ? parseInt(m[1]) : 0;
                };
                return getRes(b) - getRes(a);
              });
              return _context2.a(2, [autoOption].concat(_toConsumableArray(otherOptions)));
            case 17:
              _context2.p = 17;
              _t2 = _context2.v;
              console.error("getStreamM3u8 error:", _t2);
              return _context2.a(2, {
                error: _t2.message
              });
          }
        }, _callee2, null, [[5, 9], [0, 17]]);
      }));
      function getStreamM3u8(_x) {
        return _getStreamM3u.apply(this, arguments);
      }
      return getStreamM3u8;
    }(),
    openNativePlayer: function () {
      var _openNativePlayer = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(channelName, channelId, streamTitle) {
        var appContainer, titleEl, existingPlayer, defaultQualityUrl;
        return _regenerator().w(function (_context3) {
          while (1) switch (_context3.n) {
            case 0:
              state.inPlayer = true;
              state.playerFocusIndex = 0;
              App.nav.inMenu = false;
              appContainer = document.getElementById('app-container');
              if (appContainer) appContainer.style.display = 'none';
              state.currentStreamChannel = channelName;
              state.currentStreamId = channelId;
              state.currentStreamTitle = streamTitle || "";
              titleEl = document.getElementById('player-live-title');
              if (titleEl) titleEl.innerText = state.currentStreamTitle;
              existingPlayer = document.getElementById('av-player');
              if (!existingPlayer) {
                existingPlayer = document.createElement('object');
                existingPlayer.id = 'av-player';
                existingPlayer.setAttribute('type', 'application/avplayer');
                existingPlayer.setAttribute('style', 'width:100%; height:100%; position: absolute; z-index: -1;');
                document.getElementById('player-container').appendChild(existingPlayer);
              }
              document.getElementById('player-container').style.display = 'block';
              document.body.classList.add('player-active');
              document.documentElement.classList.add('player-active');
              _context3.n = 1;
              return this.getStreamM3u8(channelName);
            case 1:
              state.qualityOptions = _context3.v;
              if (!(state.qualityOptions && state.qualityOptions.error)) {
                _context3.n = 2;
                break;
              }
              alert("Fetch Error: " + state.qualityOptions.error);
              this.closeNativePlayer();
              return _context3.a(2);
            case 2:
              if (!(!state.qualityOptions || state.qualityOptions.length === 0)) {
                _context3.n = 3;
                break;
              }
              alert("Error: Unable to fetch video stream for " + channelName);
              this.closeNativePlayer();
              return _context3.a(2);
            case 3:
              try {
                defaultQualityUrl = state.qualityOptions.length > 1 ? state.qualityOptions[1].url : state.qualityOptions[0].url;
                this.playVideoUrl(defaultQualityUrl);
              } catch (err) {
                alert("Error starting video: " + err.message);
                this.closeNativePlayer();
              }
              this.showPlayerUI();
              this.updatePlayerFocus();
            case 4:
              return _context3.a(2);
          }
        }, _callee3, this);
      }));
      function openNativePlayer(_x2, _x3, _x4) {
        return _openNativePlayer.apply(this, arguments);
      }
      return openNativePlayer;
    }(),
    playVideoUrl: function playVideoUrl(url) {
      var _this = this;
      var isRetry = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      state.currentVideoUrl = url;
      if (!isRetry) state.retryCount = 0;
      clearTimeout(state.bufferingWatchdog);
      try {
        webapis.avplay.stop();
        webapis.avplay.close();
      } catch (e) {}
      try {
        webapis.avplay.open(url);
        try {
          webapis.avplay.setBufferingParam('PLAYER_BUFFER_FOR_PLAY', 'PLAYER_BUFFER_SIZE_IN_SECOND', 5);
          webapis.avplay.setBufferingParam('PLAYER_BUFFER_FOR_RESUME', 'PLAYER_BUFFER_SIZE_IN_SECOND', 5);
        } catch (bufErr) {
          console.warn("Impossibile impostare i parametri di buffering:", bufErr);
        }
        var listener = {
          onbufferingstart: function onbufferingstart() {
            console.log("Buffering start.");
            clearTimeout(state.bufferingWatchdog);
            state.bufferingWatchdog = setTimeout(function () {
              console.warn("Watchdog: Buffering prolungato (>15s). Riavvio stream.");
              if (state.retryCount < 3) {
                state.retryCount++;
                _this.playVideoUrl(state.currentVideoUrl, true);
              }
            }, 15000);
          },
          onbufferingprogress: function onbufferingprogress(percent) {},
          onbufferingcomplete: function onbufferingcomplete() {
            console.log("Buffering complete.");
            clearTimeout(state.bufferingWatchdog);
          },
          onstreamcompleted: function onstreamcompleted() {
            console.log("Stream Completed");
            try {
              webapis.avplay.stop();
            } catch (e) {}
          },
          oncurrentplaytime: function oncurrentplaytime(currentTime) {
            clearTimeout(state.bufferingWatchdog);
          },
          onerror: function onerror(eventType) {
            console.log("event type error : " + eventType);
            clearTimeout(state.bufferingWatchdog);
            if (state.retryCount < 3) {
              console.warn("AVPlay onerror: tento il riavvio.");
              state.retryCount++;
              setTimeout(function () {
                _this.playVideoUrl(state.currentVideoUrl, true);
              }, 2000);
            }
          },
          ondrmevent: function ondrmevent(drmEvent, drmData) {},
          onsubtitlechange: function onsubtitlechange(duration, text, data3, data4) {}
        };
        webapis.avplay.setListener(listener);
        webapis.avplay.setDisplayMethod(state.isChatOpen ? 'PLAYER_DISPLAY_MODE_LETTER_BOX' : 'PLAYER_DISPLAY_MODE_FULL_SCREEN');
        webapis.avplay.prepareAsync(function () {
          if (state.isChatOpen) {
            try {
              webapis.avplay.setDisplayRect(0, 126, 1470, 827);
            } catch (e) {}
          } else {
            try {
              webapis.avplay.setDisplayRect(0, 0, 1920, 1080);
            } catch (e) {}
          }
          webapis.avplay.play();
          state.isPlaying = true;
          document.getElementById('icon-pause').style.display = 'block';
          document.getElementById('icon-play').style.display = 'none';
        }, function (error) {
          console.error("AVPlay prepare error: " + error);
          clearTimeout(state.bufferingWatchdog);
          if (state.retryCount < 3) {
            state.retryCount++;
            setTimeout(function () {
              _this.playVideoUrl(state.currentVideoUrl, true);
            }, 2000);
          }
        });
      } catch (e) {
        console.error("AVPlay open error: ", e);
      }
    },
    toggleChat: function toggleChat() {
      var chatContainer = document.getElementById('player-chat-container');
      if (!state.isChatOpen) {
        state.isChatOpen = true;
        chatContainer.classList.remove('hidden');
        if (App.modules.chat) {
          App.modules.chat.connect(state.currentStreamChannel);
        }
        try {
          webapis.avplay.setDisplayMethod('PLAYER_DISPLAY_MODE_LETTER_BOX');
          webapis.avplay.setDisplayRect(0, 126, 1470, 827);
        } catch (e) {
          console.error("Error resizing video", e);
        }
      } else {
        state.isChatOpen = false;
        chatContainer.classList.add('hidden');
        if (App.modules.chat) {
          App.modules.chat.disconnect();
        }
        try {
          webapis.avplay.setDisplayMethod('PLAYER_DISPLAY_MODE_FULL_SCREEN');
          webapis.avplay.setDisplayRect(0, 0, 1920, 1080);
        } catch (e) {}
      }
    },
    closeNativePlayer: function closeNativePlayer() {
      state.inPlayer = false;
      if (state.isChatOpen) {
        state.isChatOpen = false;
        var chatContainer = document.getElementById('player-chat-container');
        if (chatContainer) chatContainer.classList.add('hidden');
        if (App.modules.chat) App.modules.chat.disconnect();
      }
      var appContainer = document.getElementById('app-container');
      if (appContainer) appContainer.style.display = 'block';
      try {
        webapis.avplay.stop();
        webapis.avplay.close();
      } catch (e) {
        console.error('AVPlay close error', e);
      }
      document.body.classList.remove('player-active');
      document.documentElement.classList.remove('player-active');
      document.getElementById('player-container').style.display = 'none';
      state.isQualityMenuOpen = false;
      document.getElementById('quality-menu').style.display = 'none';
      clearTimeout(state.uiTimeout);
      App.loader.unload('player');

      // Ripristino intelligente dalla cache:
      if (App.previousModule) {
        App.nav.inMenu = false;
        App.nav.navigateTo(App.previousModule).then(function () {
          if (App.modules[App.previousModule] && App.modules[App.previousModule].updateSelection) {
            App.modules[App.previousModule].updateSelection();
          }
        });
      } else {
        App.nav.inMenu = true;
        App.nav.update();
      }
    },
    showPlayerUI: function showPlayerUI() {
      var ui = document.getElementById('player-ui');
      ui.classList.remove('hidden');
      clearTimeout(state.uiTimeout);
      state.uiTimeout = setTimeout(function () {
        if (!state.isQualityMenuOpen) ui.classList.add('hidden');
      }, 4000);
    },
    updatePlayerFocus: function updatePlayerFocus() {
      if (state.isQualityMenuOpen) {
        document.querySelectorAll('.quality-item').forEach(function (el, i) {
          el.classList.toggle('focused', i === state.qualityFocusIndex);
        });
        return;
      }
      state.playerBtns.forEach(function (id, i) {
        return document.getElementById(id).classList.toggle('focused', i === state.playerFocusIndex);
      });
    },
    handleKey: function handleKey(e) {
      if (!state.inPlayer) return;
      var ui = document.getElementById('player-ui');
      var isUIHidden = ui.classList.contains('hidden');
      if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
        if (state.isQualityMenuOpen) {
          state.isQualityMenuOpen = false;
          document.getElementById('quality-menu').style.display = 'none';
          this.showPlayerUI();
          this.updatePlayerFocus();
        } else {
          this.closeNativePlayer();
        }
        return;
      }
      if (isUIHidden) {
        if (e.keyCode === 13 || e.keyCode >= 37 && e.keyCode <= 40) {
          this.showPlayerUI();
          this.updatePlayerFocus();
        }
        return;
      }
      this.showPlayerUI();
      if (state.isQualityMenuOpen) {
        if (e.keyCode === 38 && state.qualityFocusIndex > 0) state.qualityFocusIndex--;
        if (e.keyCode === 40 && state.qualityFocusIndex < state.qualityOptions.length - 1) state.qualityFocusIndex++;
        if (e.keyCode === 13) {
          this.playVideoUrl(state.qualityOptions[state.qualityFocusIndex].url);
          state.isQualityMenuOpen = false;
          document.getElementById('quality-menu').style.display = 'none';
        }
        this.updatePlayerFocus();
        return;
      }
      if (e.keyCode === 39 && state.playerFocusIndex < state.playerBtns.length - 1) state.playerFocusIndex++;
      if (e.keyCode === 37 && state.playerFocusIndex > 0) state.playerFocusIndex--;
      if (e.keyCode === 13) {
        if (state.playerFocusIndex === 0) {
          try {
            if (state.isPlaying) {
              webapis.avplay.pause();
              state.isPlaying = false;
              document.getElementById('icon-pause').style.display = 'none';
              document.getElementById('icon-play').style.display = 'block';
            } else {
              // Resume: Riavvia lo stream dall'URL corrente per rimettersi in sincro con la live
              console.log("Resuming: Restarting stream to jump to live edge.");
              this.playVideoUrl(state.currentVideoUrl);
            }
          } catch (e) {
            console.error('AVPlay play/pause error', e);
          }
        } else if (state.playerFocusIndex === 1) {
          this.toggleChat();
        } else if (state.playerFocusIndex === 2) {
          var menu = document.getElementById('quality-menu');
          menu.innerHTML = state.qualityOptions.map(function (q, i) {
            return "<div class=\"quality-item ".concat(i === 0 ? 'focused' : '', "\">").concat(q.name, "</div>");
          }).join('');
          menu.style.display = 'flex';
          state.isQualityMenuOpen = true;
          state.qualityFocusIndex = 0;
        } else if (state.playerFocusIndex === 3) {
          var channelToOpen = state.currentStreamChannel;
          this.closeNativePlayer();
          App.nav.navigateTo('channel').then(function () {
            if (App.modules.channel && App.modules.channel.openChannelView) {
              App.modules.channel.openChannelView(channelToOpen);
            }
          });
        }
      }
      this.updatePlayerFocus();
    },
    destroy: function destroy() {
      if (state.inPlayer) {
        this.closeNativePlayer();
      }
    }
  };
})();