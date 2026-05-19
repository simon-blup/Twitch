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
    channelLogin: '',
    channelData: null,
    followerCount: 0,
    isLive: false,
    liveStreamData: null,
    vods: [],
    // Array combinato di Live (se presente) + VODs
    clips: [],
    // Sezioni Verticali:
    // 1 = Striscia VODs
    // 2 = Bottone Tempo Clip
    // 3 = Striscia Clip
    activeSection: 1,
    vodCol: 0,
    clipCol: 0,
    seqId: 0,
    timeIndex: 0,
    times: [{
      id: 7,
      label: 'days_7'
    }, {
      id: 30,
      label: 'days_30'
    }],
    // Ottimizzazione rendering
    visibleVods: 6,
    visibleClips: 6
  };
  App.modules.channel = {
    init: function init() {},
    load: function () {
      var _load = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(isRestore) {
        return _regenerator().w(function (_context) {
          while (1) switch (_context.n) {
            case 0:
              if (isRestore && (state.vods.length > 0 || state.clips.length > 0)) {
                this.render();
              }
            case 1:
              return _context.a(2);
          }
        }, _callee, this);
      }));
      function load(_x) {
        return _load.apply(this, arguments);
      }
      return load;
    }(),
    openChannelView: function () {
      var _openChannelView = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(login) {
        return _regenerator().w(function (_context2) {
          while (1) switch (_context2.n) {
            case 0:
              state.channelLogin = login.toLowerCase();
              state.seqId = Date.now();
              state.activeSection = 1; // Focus iniziale sui VODs
              state.vodCol = 0;
              state.clipCol = 0;
              state.channelData = null;
              state.followerCount = 0;
              state.isLive = false;
              state.liveStreamData = null;
              state.vods = [];
              state.clips = [];
              state.visibleVods = 6;
              state.visibleClips = 6;
              this.renderLoading();
              _context2.n = 1;
              return this.fetchChannelData();
            case 1:
              return _context2.a(2);
          }
        }, _callee2, this);
      }));
      function openChannelView(_x2) {
        return _openChannelView.apply(this, arguments);
      }
      return openChannelView;
    }(),
    fetchChannelData: function () {
      var _fetchChannelData = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
        var mySeq, userRes, folRes, viewArea, _t, _t2;
        return _regenerator().w(function (_context3) {
          while (1) switch (_context3.p = _context3.n) {
            case 0:
              mySeq = state.seqId;
              _context3.p = 1;
              _context3.n = 2;
              return App.api.twitchFetch("https://api.twitch.tv/helix/users?login=".concat(state.channelLogin));
            case 2:
              userRes = _context3.v;
              if (!(mySeq !== state.seqId)) {
                _context3.n = 3;
                break;
              }
              return _context3.a(2);
            case 3:
              if (!(!userRes.data || userRes.data.length === 0)) {
                _context3.n = 4;
                break;
              }
              throw new Error("Canale non trovato");
            case 4:
              state.channelData = userRes.data[0];

              // 2. Fetch dei Follower
              _context3.p = 5;
              _context3.n = 6;
              return App.api.twitchFetch("https://api.twitch.tv/helix/channels/followers?broadcaster_id=".concat(state.channelData.id));
            case 6:
              folRes = _context3.v;
              if (!(mySeq !== state.seqId)) {
                _context3.n = 7;
                break;
              }
              return _context3.a(2);
            case 7:
              state.followerCount = folRes.total || 0;
              _context3.n = 9;
              break;
            case 8:
              _context3.p = 8;
              _t = _context3.v;
              console.error("Followers fetch error", _t);
            case 9:
              _context3.n = 10;
              return Promise.all([this.fetchVods(), this.fetchClips()]);
            case 10:
              if (!(mySeq !== state.seqId)) {
                _context3.n = 11;
                break;
              }
              return _context3.a(2);
            case 11:
              // Se non ci sono VODs ma ci sono clip, partiamo dal bottone clip
              if (state.vods.length === 0 && state.clips.length > 0) {
                state.activeSection = 2;
              }
              this.render();
              _context3.n = 14;
              break;
            case 12:
              _context3.p = 12;
              _t2 = _context3.v;
              if (!(mySeq !== state.seqId)) {
                _context3.n = 13;
                break;
              }
              return _context3.a(2);
            case 13:
              console.error("Channel Fetch Error", _t2);
              viewArea = document.getElementById('main-view-area');
              if (viewArea) viewArea.innerHTML = "<div style=\"color:red; text-align:center; padding-top:100px;\">Errore caricamento canale.</div>";
            case 14:
              return _context3.a(2);
          }
        }, _callee3, this, [[5, 8], [1, 12]]);
      }));
      function fetchChannelData() {
        return _fetchChannelData.apply(this, arguments);
      }
      return fetchChannelData;
    }(),
    fetchVods: function () {
      var _fetchVods = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4() {
        var mySeq, liveRes, liveArr, vidRes, rawVods, vodArr, _t3;
        return _regenerator().w(function (_context4) {
          while (1) switch (_context4.p = _context4.n) {
            case 0:
              mySeq = state.seqId;
              _context4.p = 1;
              _context4.n = 2;
              return App.api.twitchFetch("https://api.twitch.tv/helix/streams?user_id=".concat(state.channelData.id));
            case 2:
              liveRes = _context4.v;
              if (!(mySeq !== state.seqId)) {
                _context4.n = 3;
                break;
              }
              return _context4.a(2);
            case 3:
              liveArr = [];
              if (liveRes.data && liveRes.data.length > 0) {
                state.isLive = true;
                state.liveStreamData = liveRes.data[0];
                // Formattiamo il dato live per sembrare un VOD nella lista
                liveArr.push({
                  isLiveItem: true,
                  id: state.liveStreamData.user_id,
                  // Usiamo user_id per riaprire la live
                  title: state.liveStreamData.title,
                  user_name: state.liveStreamData.user_name,
                  view_count: state.liveStreamData.viewer_count,
                  thumbnail_url: state.liveStreamData.thumbnail_url,
                  created_at: state.liveStreamData.started_at,
                  duration: 'LIVE'
                });
              }

              // VODs (Video recenti)
              _context4.n = 4;
              return App.api.twitchFetch("https://api.twitch.tv/helix/videos?user_id=".concat(state.channelData.id, "&first=50"));
            case 4:
              vidRes = _context4.v;
              if (!(mySeq !== state.seqId)) {
                _context4.n = 5;
                break;
              }
              return _context4.a(2);
            case 5:
              rawVods = vidRes.data || []; // Se lo streamer è in live, escludi l'eventuale VOD della sessione corrente per evitare duplicati
              if (state.isLive && state.liveStreamData && state.liveStreamData.id) {
                rawVods = rawVods.filter(function (v) {
                  return v.stream_id !== state.liveStreamData.id;
                });
              }
              vodArr = rawVods.map(function (v) {
                return {
                  isLiveItem: false,
                  id: v.id,
                  title: v.title,
                  user_name: v.user_name,
                  view_count: v.view_count,
                  thumbnail_url: v.thumbnail_url,
                  created_at: v.published_at,
                  duration: v.duration,
                  url: v.url
                };
              });
              state.vods = [].concat(liveArr, _toConsumableArray(vodArr));
              _context4.n = 7;
              break;
            case 6:
              _context4.p = 6;
              _t3 = _context4.v;
              console.error("Fetch Vods Error", _t3);
            case 7:
              return _context4.a(2);
          }
        }, _callee4, null, [[1, 6]]);
      }));
      function fetchVods() {
        return _fetchVods.apply(this, arguments);
      }
      return fetchVods;
    }(),
    fetchClips: function () {
      var _fetchClips = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5() {
        var mySeq, days, startDate, url, res, _t4;
        return _regenerator().w(function (_context5) {
          while (1) switch (_context5.p = _context5.n) {
            case 0:
              mySeq = state.seqId;
              _context5.p = 1;
              days = state.times[state.timeIndex].id;
              startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
              url = "https://api.twitch.tv/helix/clips?broadcaster_id=".concat(state.channelData.id, "&started_at=").concat(startDate, "&first=50");
              _context5.n = 2;
              return App.api.twitchFetch(url, {}, 300);
            case 2:
              res = _context5.v;
              if (!(mySeq !== state.seqId)) {
                _context5.n = 3;
                break;
              }
              return _context5.a(2);
            case 3:
              state.clips = res.data || [];
              _context5.n = 5;
              break;
            case 4:
              _context5.p = 4;
              _t4 = _context5.v;
              console.error("Fetch Clips Error", _t4);
            case 5:
              return _context5.a(2);
          }
        }, _callee5, null, [[1, 4]]);
      }));
      function fetchClips() {
        return _fetchClips.apply(this, arguments);
      }
      return fetchClips;
    }(),
    renderLoading: function renderLoading() {
      var viewArea = document.getElementById('main-view-area');
      if (viewArea) {
        viewArea.innerHTML = "<div style=\"display:flex; justify-content:center; align-items:center; height:100vh; font-size:24px; color:#adadb8;\">".concat(App.t('loading'), "</div>");
      }
    },
    render: function render() {
      var viewArea = document.getElementById('main-view-area');
      if (!viewArea) return;
      var isLight = document.body.classList.contains('theme-light');
      var titleColor = isLight ? '#000' : 'white';

      // Banner sfumato dall'alto (Fallback sull'avatar ingrandito se offline_image manca)
      var banner = state.channelData.offline_image_url || state.channelData.profile_image_url || '';
      var isAvatarFallback = !state.channelData.offline_image_url;

      // Stile semplificato per massima compatibilità TV: usiamo box-shadow inset invece di mask-image per la sfumatura
      var bannerHtml = banner ? "\n                <div style=\"position: absolute; top: 0; left: 0; width: 100%; height: 500px; z-index: -1; overflow: hidden; opacity: 0.4;\">\n                    <div style=\"width: 100%; height: 100%; background-image: url('".concat(banner, "'); background-size: cover; background-position: center; ").concat(isAvatarFallback ? 'filter: blur(20px); transform: scale(1.2);' : '', "\"></div>\n                    <!-- Sfumatura CSS compatibile con tutti i browser -->\n                    <div style=\"position: absolute; bottom: 0; left: 0; width: 100%; height: 200px; background: linear-gradient(to bottom, transparent, #0e0e10);\"></div>\n                </div>\n            ") : '';
      var html = "\n                <div id=\"channel-view\" style=\"padding: 60px 0; color: white; width: 100vw; overflow-x: hidden; position: relative;\">\n                    ".concat(bannerHtml, "\n                    \n                    <!-- Header -->\n                    <div style=\"display:flex; align-items:flex-start; gap:40px; margin-bottom:60px; padding: 0 80px;\">\n                        <div style=\"display:flex; gap:40px; flex:1;\">\n                            <img src=\"").concat(state.channelData.profile_image_url, "\" style=\"width:180px; height:180px; border-radius:50%; border:6px solid #18181b; background:#18181b; box-shadow: 0 10px 30px rgba(0,0,0,0.5);\">\n                            <div style=\"padding-top:20px;\">\n                                <h1 style=\"font-size:54px; margin:0; font-weight:bold; color:").concat(titleColor, ";\">").concat(state.channelData.display_name, "</h1>\n                                <div style=\"font-size:20px; color:#adadb8; margin-top:10px; max-width: 800px; line-height: 1.4;\">").concat(state.channelData.description || 'Nessuna descrizione.', "</div>\n                            </div>\n                        </div>\n                        <div style=\"padding-top:50px; text-align:right;\">\n                            <div style=\"font-size:22px; font-weight:bold; color:").concat(titleColor, ";\">").concat(App.utils.formatViewers(state.followerCount), "</div>\n                            <div style=\"font-size:14px; color:#adadb8; text-transform:uppercase; letter-spacing:1px;\">").concat(App.t('followers'), "</div>\n                        </div>\n                    </div>\n\n                    <!-- Sezione VODs / Live -->\n                    <div id=\"section-1\" style=\"margin-bottom:60px; ").concat(state.vods.length === 0 ? 'display:none;' : '', "\">\n                        <div style=\"display:flex; align-items:center; gap:20px; margin-bottom:20px; padding: 0 80px;\">\n                            <h2 style=\"font-size:32px; margin:0;\">Video ").concat(state.isLive ? '& Diretta' : '', "</h2>\n                        </div>\n                        <div style=\"width: 100%; overflow: visible;\">\n                            <div id=\"chan-vods-strip\" style=\"display:flex; gap:20px; padding: 10px 80px; transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1); transform: translateX(0px);\">\n                                ").concat(this.renderVodItems(), "\n                            </div>\n                        </div>\n                    </div>\n\n                    <!-- Sezione Clip -->\n                    <div id=\"section-3\" style=\"margin-bottom:60px; ").concat(state.clips.length === 0 && state.vods.length > 0 ? 'display:none;' : '', "\">\n                        <div style=\"display:flex; align-items:center; gap:20px; margin-bottom:20px; padding: 0 80px;\">\n                            <h2 style=\"font-size:32px; margin:0;\">").concat(App.t('clips'), "</h2>\n                            <div id=\"chan-btn-time\" class=\"cat-filter-btn\" style=\"padding:8px 20px; background:#bf94ff; color:black; border-radius:30px; border:3px solid transparent; font-size:18px; font-weight:bold; transition:0.2s; display:flex; align-items:center; gap:12px;\">\n                                <span>").concat(App.t(state.times[state.timeIndex].label), "</span>\n                                <div style=\"display:flex; flex-direction:column; line-height:0.8; font-size:10px; opacity:0.8;\"><span>\u25B2</span><span>\u25BC</span></div>\n                            </div>\n                        </div>\n                        <div style=\"width: 100%; overflow: visible;\">\n                            <div id=\"chan-clips-strip\" style=\"display:flex; gap:20px; padding: 10px 80px; transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1); transform: translateX(0px);\">\n                                ").concat(this.renderClipItems(), "\n                            </div>\n                        </div>\n                    </div>\n                </div>\n            ");
      viewArea.innerHTML = html;
      this.updateSelection();
    },
    renderVodItems: function renderVodItems() {
      if (state.vods.length === 0) return "<div style=\"color:#adadb8; font-size:20px;\">Nessun video trovato.</div>";
      return state.vods.slice(0, state.visibleVods).map(function (v, i) {
        // Parser specifico e sicuro per i VOD e le Live
        var thumb = 'https://vod-secure.twitch.tv/_404/404_processing_600x338.png';
        if (v.thumbnail_url) {
          thumb = v.thumbnail_url.replace('%{width}', '600').replace('%{height}', '338').replace('{width}', '600').replace('{height}', '338');
        }
        var durationBadge = v.isLiveItem ? "<div class=\"badge-live\">LIVE</div>" : "<div class=\"badge-live\" style=\"background:rgba(0,0,0,0.8);\">".concat(v.duration, "</div>");
        var viewerBadge = v.isLiveItem ? "<div class=\"badge-viewers\">".concat(App.utils.formatViewers(v.view_count), "</div>") : "<div class=\"badge-viewers no-dot\" style=\"top:20px; right:20px; bottom:auto; left:auto;\">".concat(App.utils.formatViewers(v.view_count), " views</div>");
        return "\n                    <div id=\"chan-item-1-".concat(i, "\" class=\"channel-card follow-card\" style=\"flex:0 0 600px; width:600px;\">\n                        ").concat(durationBadge, "\n                        ").concat(viewerBadge, "\n                        <img src=\"").concat(thumb, "\" onerror=\"this.src='https://vod-secure.twitch.tv/_404/404_processing_600x338.png'\" style=\"width:100%; height:100%; object-fit:cover;\">\n                        <div class=\"card-info\">\n                            <div style=\"font-size:22px; font-weight:bold; color:white;\">").concat(v.title, "</div>\n                            <div style=\"font-size:16px; color:#adadb8; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;\">").concat(new Date(v.created_at).toLocaleDateString(), "</div>\n                        </div>\n                    </div>\n                ");
      }).join('');
    },
    renderClipItems: function renderClipItems() {
      if (state.clips.length === 0) return "<div style=\"color:#adadb8; font-size:20px;\">Nessuna clip trovata.</div>";
      return state.clips.slice(0, state.visibleClips).map(function (c, i) {
        var thumb = c.thumbnail_url;
        return "\n                    <div id=\"chan-item-3-".concat(i, "\" class=\"channel-card follow-card\" style=\"flex:0 0 600px; width:600px;\">\n                        <div class=\"badge-viewers no-dot\" style=\"top:20px; right:20px; bottom:auto; left:auto;\">").concat(App.utils.formatViewers(c.view_count), " views</div>\n                        <img src=\"").concat(thumb, "\" loading=\"lazy\" style=\"width:100%; height:100%; object-fit:cover;\">\n                        <div class=\"card-info\">\n                            <div style=\"font-size:22px; font-weight:bold; color:white;\">").concat(c.title, "</div>\n                            <div style=\"font-size:16px; color:#adadb8; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;\">").concat(c.creator_name, "</div>\n                        </div>\n                    </div>\n                ");
      }).join('');
    },
    updateSelection: function updateSelection() {
      // Reset
      document.querySelectorAll('.cat-filter-btn').forEach(function (el) {
        el.style.borderColor = 'transparent';
        el.style.background = '#bf94ff';
        el.style.color = 'black';
        el.style.transform = 'scale(1)';
      });
      document.querySelectorAll('.channel-card').forEach(function (el) {
        return el.classList.remove('selected');
      });
      var targetContainer = null;
      if (state.activeSection === 2) {
        var btn = document.getElementById('chan-btn-time');
        if (btn) {
          btn.style.borderColor = 'white';
          btn.style.background = '#a970ff';
          btn.style.transform = 'scale(1.05)';
          targetContainer = document.getElementById('section-3');
        }
      } else if (state.activeSection === 1) {
        var item = document.getElementById("chan-item-1-".concat(state.vodCol));
        if (item) {
          item.classList.add('selected');
        }
        var strip = document.getElementById('chan-vods-strip');
        if (strip) strip.style.transform = "translateX(-".concat(state.vodCol * 620, "px)");
        targetContainer = document.getElementById('section-1');
      } else if (state.activeSection === 3) {
        var _item = document.getElementById("chan-item-3-".concat(state.clipCol));
        if (_item) {
          _item.classList.add('selected');
        }
        var _strip = document.getElementById('chan-clips-strip');
        if (_strip) _strip.style.transform = "translateX(-".concat(state.clipCol * 620, "px)");
        targetContainer = document.getElementById('section-3');
      }
      if (targetContainer) {
        targetContainer.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      } else if (App.nav.inMenu) {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    },
    handleKey: function handleKey(e) {
      if (e.keyCode === 39) {
        // Right
        if (state.activeSection === 1) {
          if (state.vodCol < state.vods.length - 1) {
            state.vodCol++;
            if (state.vodCol >= state.visibleVods - 2) {
              state.visibleVods += 3;
              document.getElementById('chan-vods-strip').innerHTML = this.renderVodItems();
            }
          }
        } else if (state.activeSection === 3) {
          if (state.clipCol < state.clips.length - 1) {
            state.clipCol++;
            if (state.clipCol >= state.visibleClips - 2) {
              state.visibleClips += 3;
              document.getElementById('chan-clips-strip').innerHTML = this.renderClipItems();
            }
          }
        }
      } else if (e.keyCode === 37) {
        // Left
        if (state.activeSection === 1 && state.vodCol > 0) {
          state.vodCol--;
        } else if (state.activeSection === 3 && state.clipCol > 0) {
          state.clipCol--;
        }
      } else if (e.keyCode === 40) {
        // Down
        if (state.activeSection === 1) {
          if (state.clips.length > 0) {
            state.activeSection = 2; // Va al bottone tempo clip
          }
        } else if (state.activeSection === 2) {
          if (state.clips.length > 0) state.activeSection = 3;
        }
      } else if (e.keyCode === 38) {
        // Up
        if (state.activeSection === 3) {
          state.activeSection = 2;
        } else if (state.activeSection === 2) {
          if (state.vods.length > 0) state.activeSection = 1;
        }
      } else if (e.keyCode === 13) {
        // OK
        if (state.activeSection === 2) {
          // Time
          state.timeIndex = (state.timeIndex + 1) % state.times.length;
          this.refreshClips();
        } else if (state.activeSection === 1) {
          var v = state.vods[state.vodCol];
          if (v.isLiveItem) {
            App.nav.navigateTo('player').then(function () {
              App.modules.player.openNativePlayer(v.user_name, v.id, v.title);
            });
          } else {
            // Riproduzione VOD
            alert("La riproduzione dei VOD richiede l'integrazione con l'API Usher per i VOD.");
          }
        } else if (state.activeSection === 3) {
          var c = state.clips[state.clipCol];
          App.nav.navigateTo('player').then(function () {
            App.modules.player.openNativePlayer(c.creator_name, state.channelData.id, c.title, c.url);
          });
        }
      } else if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
        this.goBack();
        return;
      }
      this.updateSelection();
    },
    refreshClips: function () {
      var _refreshClips = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6() {
        var strip, btn;
        return _regenerator().w(function (_context6) {
          while (1) switch (_context6.n) {
            case 0:
              state.clips = [];
              state.visibleClips = 6;
              state.clipCol = 0;
              strip = document.getElementById('chan-clips-strip');
              if (strip) {
                strip.style.transform = 'translateX(0px)';
                strip.innerHTML = "<div style=\"color:#adadb8; font-size:18px;\">".concat(App.t('loading'), "</div>");
              }
              _context6.n = 1;
              return this.fetchClips();
            case 1:
              if (strip) strip.innerHTML = this.renderClipItems();
              btn = document.getElementById('chan-btn-time');
              if (btn) btn.querySelector('span').innerText = App.t(state.times[state.timeIndex].label);
              this.updateSelection();
            case 2:
              return _context6.a(2);
          }
        }, _callee6, this);
      }));
      function refreshClips() {
        return _refreshClips.apply(this, arguments);
      }
      return refreshClips;
    }(),
    goBack: function goBack() {
      App.nav.inMenu = false;
      var prevModule = App.nav.menuMap[App.nav.focusIndex] || 'home';
      App.nav.navigateTo(prevModule).then(function () {
        if (App.modules[prevModule] && App.modules[prevModule].updateSelection) {
          App.modules[prevModule].updateSelection();
        }
      });
    },
    destroy: function destroy() {
      state.seqId++;
      var viewArea = document.getElementById('main-view-area');
      if (viewArea) {
        var images = viewArea.querySelectorAll('img');
        images.forEach(function (img) {
          return img.src = '';
        });
        viewArea.innerHTML = '';
      }
    }
  };
})();