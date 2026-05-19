"use strict";

function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t.return || t.return(); } finally { if (u) throw o; } } }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
(function () {
  var ws = null;
  var messageQueue = [];
  var isRendering = false;
  var emoteCache = {}; // Cache in RAM for Base64 emotes
  var MAX_NODES = 25;
  App.modules.chat = {
    init: function init() {
      // Nothing to do until we open it
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
    // Chat doesn't have a dedicated view area like home

    connect: function connect(channel) {
      var _this = this;
      if (ws) this.disconnect();
      var chatContainer = document.getElementById('player-chat-container');
      if (chatContainer) {
        // Rimuoviamo l'iframe e l'overlay di caricamento, usiamo solo un div nativo
        chatContainer.innerHTML = '<div id="chat-messages" style="display:flex; flex-direction:column; justify-content:flex-end; height:100%; padding: 20px; overflow:hidden; gap: 12px; font-size: 18px; font-family: sans-serif;"></div>';
      }
      ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
      ws.onopen = function () {
        ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
        ws.send("PASS SCHMOOPIIE");
        ws.send("NICK justinfan".concat(Math.floor(Math.random() * 80000)));
        ws.send("JOIN #".concat(channel.toLowerCase()));
      };
      ws.onmessage = function (event) {
        var lines = event.data.split('\r\n');
        lines.forEach(function (line) {
          if (!line) return;
          if (line.startsWith('PING')) {
            ws.send('PONG :tmi.twitch.tv');
          } else if (line.includes('PRIVMSG')) {
            _this.handleMessage(line);
          }
        });
      };
    },
    handleMessage: function handleMessage(rawLine) {
      // Estrazione Tags (colori, emotes)
      var tags = {};
      var msgStr = rawLine;
      if (rawLine.startsWith('@')) {
        var splitIdx = rawLine.indexOf(' ');
        var tagsStr = rawLine.substring(1, splitIdx);
        msgStr = rawLine.substring(splitIdx + 1);
        tagsStr.split(';').forEach(function (tag) {
          var _tag$split = tag.split('='),
            _tag$split2 = _slicedToArray(_tag$split, 2),
            k = _tag$split2[0],
            v = _tag$split2[1];
          tags[k] = v;
        });
      }

      // Estrazione Utente e Messaggio
      var prefixEnd = msgStr.indexOf(' ', 1);
      var prefix = msgStr.substring(0, prefixEnd);
      var userMatch = prefix.match(/^:([^!]+)!/);
      var user = userMatch ? userMatch[1] : 'Unknown';
      var msgStart = msgStr.indexOf(' :', prefixEnd);
      var text = msgStr.substring(msgStart + 2);
      var color = tags['color'] || '#bf94ff';
      messageQueue.push({
        user: user,
        color: color,
        text: text,
        emotes: tags['emotes']
      });
      this.scheduleRender();
    },
    scheduleRender: function scheduleRender() {
      var _this2 = this;
      if (isRendering || messageQueue.length === 0) return;
      isRendering = true;

      // requestAnimationFrame accorpa le modifiche grafiche al refresh del display (60hz), annullando il lag
      requestAnimationFrame(/*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
        var container, fragment, messagesToRender, _iterator, _step, msg, div, formattedText, _t;
        return _regenerator().w(function (_context2) {
          while (1) switch (_context2.p = _context2.n) {
            case 0:
              container = document.getElementById('chat-messages');
              if (container) {
                _context2.n = 1;
                break;
              }
              messageQueue = [];
              isRendering = false;
              return _context2.a(2);
            case 1:
              // DocumentFragment: Creiamo i nodi in memoria e li inseriamo tutti in una volta
              fragment = document.createDocumentFragment();
              messagesToRender = messageQueue.splice(0, 10); // Batch limit per non bloccare il thread
              _iterator = _createForOfIteratorHelper(messagesToRender);
              _context2.p = 2;
              _iterator.s();
            case 3:
              if ((_step = _iterator.n()).done) {
                _context2.n = 6;
                break;
              }
              msg = _step.value;
              div = document.createElement('div');
              div.style.lineHeight = '1.5';
              div.style.wordWrap = 'break-word';
              formattedText = _this2.escapeHtml(msg.text);
              _context2.n = 4;
              return _this2.parseEmotes(formattedText, msg.emotes);
            case 4:
              formattedText = _context2.v;
              div.innerHTML = "<span style=\"color:".concat(msg.color, "; font-weight:bold;\">").concat(msg.user, "</span> <span style=\"color:#efeff1;\">").concat(formattedText, "</span>");
              fragment.appendChild(div);
            case 5:
              _context2.n = 3;
              break;
            case 6:
              _context2.n = 8;
              break;
            case 7:
              _context2.p = 7;
              _t = _context2.v;
              _iterator.e(_t);
            case 8:
              _context2.p = 8;
              _iterator.f();
              return _context2.f(8);
            case 9:
              container.appendChild(fragment);

              // Blocco rigido della memoria DOM
              while (container.childNodes.length > MAX_NODES) {
                container.removeChild(container.firstChild);
              }
              isRendering = false;
              if (messageQueue.length > 0) _this2.scheduleRender();
            case 10:
              return _context2.a(2);
          }
        }, _callee2, null, [[2, 7, 8, 9]]);
      })));
    },
    escapeHtml: function escapeHtml(unsafe) {
      return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    },
    parseEmotes: function () {
      var _parseEmotes = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(text, emotesStr) {
        var emotes, res, _i, _emotes, emote, b64, imgTag;
        return _regenerator().w(function (_context3) {
          while (1) switch (_context3.n) {
            case 0:
              if (emotesStr) {
                _context3.n = 1;
                break;
              }
              return _context3.a(2, text);
            case 1:
              // Esempio: 25:0-4,12-16/1902:6-10
              emotes = [];
              emotesStr.split('/').forEach(function (emote) {
                var _emote$split = emote.split(':'),
                  _emote$split2 = _slicedToArray(_emote$split, 2),
                  id = _emote$split2[0],
                  positions = _emote$split2[1];
                if (!positions) return;
                positions.split(',').forEach(function (pos) {
                  var _pos$split = pos.split('-'),
                    _pos$split2 = _slicedToArray(_pos$split, 2),
                    start = _pos$split2[0],
                    end = _pos$split2[1];
                  emotes.push({
                    id: id,
                    start: parseInt(start),
                    end: parseInt(end)
                  });
                });
              });

              // Ordina al contrario per rimpiazzare senza sballare gli indici
              emotes.sort(function (a, b) {
                return b.start - a.start;
              });
              res = text;
              _i = 0, _emotes = emotes;
            case 2:
              if (!(_i < _emotes.length)) {
                _context3.n = 5;
                break;
              }
              emote = _emotes[_i];
              _context3.n = 3;
              return this.getEmoteBase64(emote.id);
            case 3:
              b64 = _context3.v;
              imgTag = "<img src=\"".concat(b64, "\" style=\"vertical-align: middle; height: 28px; margin: -5px 0;\">");
              res = res.substring(0, emote.start) + imgTag + res.substring(emote.end + 1);
            case 4:
              _i++;
              _context3.n = 2;
              break;
            case 5:
              return _context3.a(2, res);
          }
        }, _callee3, this);
      }));
      function parseEmotes(_x, _x2) {
        return _parseEmotes.apply(this, arguments);
      }
      return parseEmotes;
    }(),
    getEmoteBase64: function () {
      var _getEmoteBase = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(id) {
        return _regenerator().w(function (_context4) {
          while (1) switch (_context4.n) {
            case 0:
              if (!emoteCache[id]) {
                _context4.n = 1;
                break;
              }
              return _context4.a(2, emoteCache[id]);
            case 1:
              return _context4.a(2, new Promise(function (resolve) {
                var img = new Image();
                img.crossOrigin = 'Anonymous';
                img.onload = function () {
                  try {
                    var canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    var dataURL = canvas.toDataURL('image/png'); // Codifica in stringa pura
                    emoteCache[id] = dataURL;
                    resolve(dataURL);
                  } catch (e) {
                    // Fallback se la policy CORS blocca l'estrazione su TV
                    resolve("https://static-cdn.jtvnw.net/emoticons/v2/".concat(id, "/default/dark/1.0"));
                  }
                };
                img.onerror = function () {
                  return resolve("https://static-cdn.jtvnw.net/emoticons/v2/".concat(id, "/default/dark/1.0"));
                };
                img.src = "https://static-cdn.jtvnw.net/emoticons/v2/".concat(id, "/default/dark/1.0");
              }));
          }
        }, _callee4);
      }));
      function getEmoteBase64(_x3) {
        return _getEmoteBase.apply(this, arguments);
      }
      return getEmoteBase64;
    }(),
    disconnect: function disconnect() {
      if (ws) {
        ws.close();
        ws = null;
      }
      messageQueue = [];
      var container = document.getElementById('player-chat-container');
      if (container) container.innerHTML = '';
    },
    destroy: function destroy() {
      this.disconnect();
    }
  };
})();