"use strict";

function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
(function () {
  var state = {
    categoryData: null,
    streams: [],
    clips: [],
    // Sezioni Verticali:
    // 0 = Bottone Lingua
    // 1 = Striscia Live
    // 2 = Bottone Tempo
    // 3 = Striscia Clip
    activeSection: 1,
    streamCol: 0,
    clipCol: 0,
    seqId: 0,
    // Filtri
    langIndex: 0,
    langs: [{
      id: 'en',
      label: 'lang_en_only'
    }, {
      id: 'it',
      label: 'lang_it'
    }, {
      id: 'fr',
      label: 'lang_fr'
    }, {
      id: 'es',
      label: 'lang_es'
    }, {
      id: 'zh',
      label: 'lang_zh'
    }],
    timeIndex: 0,
    times: [{
      id: 7,
      label: 'days_7'
    }, {
      id: 30,
      label: 'days_30'
    }],
    // Ottimizzazione rendering
    visibleStreams: 6,
    visibleClips: 6
  };
  App.modules.category = {
    init: function init() {},
    load: function () {
      var _load = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(isRestore) {
        return _regenerator().w(function (_context) {
          while (1) switch (_context.n) {
            case 0:
              if (isRestore && (state.streams.length > 0 || state.clips.length > 0)) {
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
    open: function () {
      var _open = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(categoryObj) {
        var currentGlobalLang, foundIndex;
        return _regenerator().w(function (_context2) {
          while (1) switch (_context2.n) {
            case 0:
              state.categoryData = categoryObj;
              state.seqId = Date.now();
              state.activeSection = 1; // Focus iniziale sulla prima live
              state.streamCol = 0;
              state.clipCol = 0;
              state.streams = [];
              state.clips = [];
              state.visibleStreams = 6;
              state.visibleClips = 6;

              // Imposta la lingua del filtro in base alla lingua globale dell'app se possibile
              currentGlobalLang = App.settings.language || 'English';
              foundIndex = state.langs.findIndex(function (l) {
                return App.t(l.label) === currentGlobalLang || l.label === currentGlobalLang;
              });
              if (foundIndex !== -1) state.langIndex = foundIndex;
              this.renderLoading();
              _context2.n = 1;
              return Promise.all([this.fetchStreams(), this.fetchClips()]);
            case 1:
              // Se non ci sono stream ma ci sono clip, partiamo dalle clip
              if (state.streams.length === 0 && state.clips.length > 0) {
                state.activeSection = 3;
              } else if (state.streams.length === 0 && state.clips.length === 0) {
                state.activeSection = 0; // Se è tutto vuoto, focus sul bottone lingua
              }
              this.render();
            case 2:
              return _context2.a(2);
          }
        }, _callee2, this);
      }));
      function open(_x2) {
        return _open.apply(this, arguments);
      }
      return open;
    }(),
    fetchStreams: function () {
      var _fetchStreams = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
        var mySeq, url, selectedLang, res, _t;
        return _regenerator().w(function (_context3) {
          while (1) switch (_context3.p = _context3.n) {
            case 0:
              mySeq = state.seqId;
              _context3.p = 1;
              url = "https://api.twitch.tv/helix/streams?game_id=".concat(state.categoryData.id, "&first=50");
              selectedLang = state.langs[state.langIndex].id;
              if (selectedLang === 'en') {
                url += "&language=en";
              } else {
                url += "&language=".concat(selectedLang, "&language=en");
              }
              _context3.n = 2;
              return App.api.twitchFetch(url, {}, 60);
            case 2:
              res = _context3.v;
              if (!(mySeq !== state.seqId)) {
                _context3.n = 3;
                break;
              }
              return _context3.a(2);
            case 3:
              state.streams = res.data || [];
              _context3.n = 5;
              break;
            case 4:
              _context3.p = 4;
              _t = _context3.v;
              console.error("Fetch Streams Error", _t);
            case 5:
              return _context3.a(2);
          }
        }, _callee3, null, [[1, 4]]);
      }));
      function fetchStreams() {
        return _fetchStreams.apply(this, arguments);
      }
      return fetchStreams;
    }(),
    fetchClips: function () {
      var _fetchClips = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4() {
        var mySeq, days, startDate, url, res, _t2;
        return _regenerator().w(function (_context4) {
          while (1) switch (_context4.p = _context4.n) {
            case 0:
              mySeq = state.seqId;
              _context4.p = 1;
              days = state.times[state.timeIndex].id;
              startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
              url = "https://api.twitch.tv/helix/clips?game_id=".concat(state.categoryData.id, "&started_at=").concat(startDate, "&first=40");
              _context4.n = 2;
              return App.api.twitchFetch(url, {}, 300);
            case 2:
              res = _context4.v;
              if (!(mySeq !== state.seqId)) {
                _context4.n = 3;
                break;
              }
              return _context4.a(2);
            case 3:
              state.clips = res.data || [];
              _context4.n = 5;
              break;
            case 4:
              _context4.p = 4;
              _t2 = _context4.v;
              console.error("Fetch Clips Error", _t2);
            case 5:
              return _context4.a(2);
          }
        }, _callee4, null, [[1, 4]]);
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

      // Ricalcoliamo una stima dei viewers basata sugli stream caricati
      var totalViewers = state.streams.reduce(function (acc, s) {
        return acc + s.viewer_count;
      }, 0);
      var boxArt = App.utils.getSafeThumb(state.categoryData.box_art_url, 'category');
      var plusSign = state.streams.length >= 40 || totalViewers > 1000 ? '+' : '';
      var html = "\n                <!-- Nessun padding laterale globale per permettere lo scorrimento a tutto schermo -->\n                <div id=\"category-view\" style=\"padding: 40px 0; color: white; width: 100vw; overflow-x: hidden;\">\n                    \n                    <!-- Header: Titolo e Spettatori -->\n                    <div style=\"display:flex; align-items:center; gap:40px; margin-bottom:50px; padding: 0 80px;\">\n                        <img src=\"".concat(boxArt, "\" style=\"width:120px; height:160px; border-radius:10px; box-shadow:0 10px 30px rgba(0,0,0,0.5);\">\n                        <div>\n                            <h1 style=\"font-size:54px; margin:0; font-weight:bold;\">").concat(state.categoryData.name, "</h1>\n                            <div style=\"font-size:24px; color:#bf94ff; margin-top:10px; font-weight:bold;\">\n                                ").concat(plusSign).concat(App.utils.formatViewers(totalViewers), " ").concat(App.t('viewers'), "\n                            </div>\n                        </div>\n                    </div>\n\n                    <!-- Sezione Canali Live -->\n                    <div id=\"section-1\" style=\"margin-bottom:60px;\">\n                        <div style=\"display:flex; align-items:center; gap:20px; margin-bottom:20px; padding: 0 80px;\">\n                            <h2 style=\"font-size:32px; margin:0;\">").concat(App.t('search_live'), "</h2>\n                            <div id=\"cat-btn-lang\" class=\"cat-filter-btn\" style=\"padding:8px 20px; background:#bf94ff; color:black; border-radius:30px; border:3px solid transparent; font-size:18px; font-weight:bold; transition:0.2s; display:flex; align-items:center; gap:12px;\">\n                                <span>").concat(App.t(state.langs[state.langIndex].label), "</span>\n                                <div style=\"display:flex; flex-direction:column; line-height:0.8; font-size:10px; opacity:0.8;\"><span>\u25B2</span><span>\u25BC</span></div>\n                            </div>\n                        </div>\n                        <div style=\"width: 100%; overflow: visible;\">\n                            <div id=\"cat-streams-strip\" style=\"display:flex; gap:20px; padding: 10px 80px; transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1); transform: translateX(0px);\">\n                                ").concat(this.renderStreamItems(), "\n                            </div>\n                        </div>\n                    </div>\n\n                    <!-- Sezione Clip -->\n                    <div id=\"section-3\" style=\"margin-bottom:60px;\">\n                        <div style=\"display:flex; align-items:center; gap:20px; margin-bottom:20px; padding: 0 80px;\">\n                            <h2 style=\"font-size:32px; margin:0;\">").concat(App.t('clips'), "</h2>\n                            <div id=\"cat-btn-time\" class=\"cat-filter-btn\" style=\"padding:8px 20px; background:#bf94ff; color:black; border-radius:30px; border:3px solid transparent; font-size:18px; font-weight:bold; transition:0.2s; display:flex; align-items:center; gap:12px;\">\n                                <span>").concat(App.t(state.times[state.timeIndex].label), "</span>\n                                <div style=\"display:flex; flex-direction:column; line-height:0.8; font-size:10px; opacity:0.8;\"><span>\u25B2</span><span>\u25BC</span></div>\n                            </div>\n                        </div>\n                        <div style=\"width: 100%; overflow: visible;\">\n                            <div id=\"cat-clips-strip\" style=\"display:flex; gap:20px; padding: 10px 80px; transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1); transform: translateX(0px);\">\n                                ").concat(this.renderClipItems(), "\n                            </div>\n                        </div>\n                    </div>\n                </div>\n            ");
      viewArea.innerHTML = html;
      this.updateSelection();
    },
    renderStreamItems: function renderStreamItems() {
      if (state.streams.length === 0) return "<div style=\"color:#adadb8; font-size:20px;\">Nessun canale live trovato.</div>";
      return state.streams.slice(0, state.visibleStreams).map(function (s, i) {
        var thumb = App.utils.getSafeThumb(s.thumbnail_url, 'stream');
        return "\n                    <div id=\"cat-item-1-".concat(i, "\" class=\"channel-card follow-card\" style=\"flex:0 0 600px; width:600px;\">\n                        <div class=\"badge-live\">LIVE</div>\n                        <div class=\"badge-viewers\">").concat(App.utils.formatViewers(s.viewer_count), "</div>\n                        <img src=\"").concat(thumb, "\" style=\"width:100%; height:100%; object-fit:cover;\">\n                        <div class=\"card-info\">\n                            <div style=\"font-size:22px; font-weight:bold; color:white;\">").concat(s.user_name, "</div>\n                            <div style=\"font-size:16px; color:#adadb8; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;\">").concat(s.title, "</div>\n                        </div>\n                    </div>\n                ");
      }).join('');
    },
    renderClipItems: function renderClipItems() {
      if (state.clips.length === 0) return "<div style=\"color:#adadb8; font-size:20px;\">Nessuna clip trovata.</div>";
      return state.clips.slice(0, state.visibleClips).map(function (c, i) {
        var thumb = c.thumbnail_url;
        return "\n                    <div id=\"cat-item-3-".concat(i, "\" class=\"channel-card follow-card\" style=\"flex:0 0 600px; width:600px;\">\n                        <!-- no-dot rimosso il pallino rosso -->\n                        <div class=\"badge-viewers no-dot\" style=\"top:20px; right:20px; bottom:auto; left:auto;\">").concat(App.utils.formatViewers(c.view_count), " views</div>\n                        <img src=\"").concat(thumb, "\" style=\"width:100%; height:100%; object-fit:cover;\">\n                        <div class=\"card-info\">\n                            <div style=\"font-size:22px; font-weight:bold; color:white;\">").concat(c.title, "</div>\n                            <div style=\"font-size:16px; color:#adadb8; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;\">").concat(c.creator_name, "</div>\n                        </div>\n                    </div>\n                ");
      }).join('');
    },
    updateSelection: function updateSelection() {
      // Reset Bottoni
      document.querySelectorAll('.cat-filter-btn').forEach(function (el) {
        el.style.borderColor = 'transparent';
        el.style.background = '#bf94ff';
        el.style.color = 'black';
        el.style.transform = 'scale(1)';
      });
      // Reset Card
      document.querySelectorAll('.channel-card').forEach(function (el) {
        return el.classList.remove('selected');
      });
      var targetContainer = null;
      if (state.activeSection === 0) {
        var btn = document.getElementById('cat-btn-lang');
        if (btn) {
          btn.style.borderColor = 'white';
          btn.style.background = '#a970ff';
          btn.style.transform = 'scale(1.05)';
          targetContainer = document.getElementById('section-1');
        }
      } else if (state.activeSection === 2) {
        var _btn = document.getElementById('cat-btn-time');
        if (_btn) {
          _btn.style.borderColor = 'white';
          _btn.style.background = '#a970ff';
          _btn.style.transform = 'scale(1.05)';
          targetContainer = document.getElementById('section-3');
        }
      } else if (state.activeSection === 1) {
        var item = document.getElementById("cat-item-1-".concat(state.streamCol));
        if (item) {
          item.classList.add('selected');
        }
        // Trasla l'intera striscia per uno scorrimento perfetto. Offset = (larghezza card 600 + gap 20)
        var strip = document.getElementById('cat-streams-strip');
        if (strip) strip.style.transform = "translateX(-".concat(state.streamCol * 620, "px)");
        targetContainer = document.getElementById('section-1');
      } else if (state.activeSection === 3) {
        var _item = document.getElementById("cat-item-3-".concat(state.clipCol));
        if (_item) {
          _item.classList.add('selected');
        }
        // Trasla l'intera striscia per uno scorrimento perfetto
        var _strip = document.getElementById('cat-clips-strip');
        if (_strip) _strip.style.transform = "translateX(-".concat(state.clipCol * 620, "px)");
        targetContainer = document.getElementById('section-3');
      }

      // Scroll Verticale Nativo (Non usare sulle card singole altrimenti rompono il translateX!)
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
          if (state.streamCol < state.streams.length - 1) {
            state.streamCol++;
            if (state.streamCol >= state.visibleStreams - 2) {
              state.visibleStreams += 3;
              document.getElementById('cat-streams-strip').innerHTML = this.renderStreamItems();
            }
          }
        } else if (state.activeSection === 3) {
          if (state.clipCol < state.clips.length - 1) {
            state.clipCol++;
            if (state.clipCol >= state.visibleClips - 2) {
              state.visibleClips += 3;
              document.getElementById('cat-clips-strip').innerHTML = this.renderClipItems();
            }
          }
        }
      } else if (e.keyCode === 37) {
        // Left
        if (state.activeSection === 1 && state.streamCol > 0) {
          state.streamCol--;
        } else if (state.activeSection === 3 && state.clipCol > 0) {
          state.clipCol--;
        }
      } else if (e.keyCode === 40) {
        // Down
        if (state.activeSection === 0) {
          if (state.streams.length > 0) state.activeSection = 1;else state.activeSection = 2;
        } else if (state.activeSection === 1) {
          state.activeSection = 2; // Va sempre al bottone tempo
        } else if (state.activeSection === 2) {
          if (state.clips.length > 0) state.activeSection = 3;
        }
      } else if (e.keyCode === 38) {
        // Up
        if (state.activeSection === 3) {
          state.activeSection = 2;
        } else if (state.activeSection === 2) {
          if (state.streams.length > 0) state.activeSection = 1;else state.activeSection = 0;
        } else if (state.activeSection === 1) {
          state.activeSection = 0;
        }
      } else if (e.keyCode === 13) {
        // OK
        if (state.activeSection === 0) {
          // Lang
          state.langIndex = (state.langIndex + 1) % state.langs.length;
          this.refreshStreams();
        } else if (state.activeSection === 2) {
          // Time
          state.timeIndex = (state.timeIndex + 1) % state.times.length;
          this.refreshClips();
        } else if (state.activeSection === 1) {
          var s = state.streams[state.streamCol];
          App.nav.navigateTo('player').then(function () {
            App.modules.player.openNativePlayer(s.user_login || s.user_name, s.user_id, s.title);
          });
        } else if (state.activeSection === 3) {
          var c = state.clips[state.clipCol];
          App.nav.navigateTo('player').then(function () {
            App.modules.player.openNativePlayer(c.broadcaster_name, c.broadcaster_id, c.title, c.url);
          });
        }
      } else if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
        this.goBack();
        return;
      }
      this.updateSelection();
    },
    refreshStreams: function () {
      var _refreshStreams = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5() {
        var strip, btn;
        return _regenerator().w(function (_context5) {
          while (1) switch (_context5.n) {
            case 0:
              state.streams = [];
              state.visibleStreams = 6;
              state.streamCol = 0;
              strip = document.getElementById('cat-streams-strip');
              if (strip) {
                strip.style.transform = 'translateX(0px)';
                strip.innerHTML = "<div style=\"color:#adadb8; font-size:18px;\">".concat(App.t('loading'), "</div>");
              }
              _context5.n = 1;
              return this.fetchStreams();
            case 1:
              if (strip) strip.innerHTML = this.renderStreamItems();
              btn = document.getElementById('cat-btn-lang');
              if (btn) btn.querySelector('span').innerText = App.t(state.langs[state.langIndex].label);
              this.updateSelection();
            case 2:
              return _context5.a(2);
          }
        }, _callee5, this);
      }));
      function refreshStreams() {
        return _refreshStreams.apply(this, arguments);
      }
      return refreshStreams;
    }(),
    refreshClips: function () {
      var _refreshClips = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6() {
        var strip, btn;
        return _regenerator().w(function (_context6) {
          while (1) switch (_context6.n) {
            case 0:
              state.clips = [];
              state.visibleClips = 6;
              state.clipCol = 0;
              strip = document.getElementById('cat-clips-strip');
              if (strip) {
                strip.style.transform = 'translateX(0px)';
                strip.innerHTML = "<div style=\"color:#adadb8; font-size:18px;\">".concat(App.t('loading'), "</div>");
              }
              _context6.n = 1;
              return this.fetchClips();
            case 1:
              if (strip) strip.innerHTML = this.renderClipItems();
              btn = document.getElementById('cat-btn-time');
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
      App.nav.navigateTo(prevModule);
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