"use strict";

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
  var state = {
    dataRows: [],
    activeRow: 0,
    activeCol: 0,
    colIndices: [],
    isInputFocused: false,
    searchSequence: 0
  };
  var searchTimeout = null;
  App.modules.search = {
    init: function init() {
      var _this = this;
      state = {
        dataRows: [],
        activeRow: -1,
        // -1 means focus is on input
        activeCol: 0,
        colIndices: [],
        isInputFocused: false,
        searchSequence: 0
      };
      var searchInput = document.getElementById('search-input');
      if (searchInput) {
        var newListener = function newListener(e) {
          clearTimeout(searchTimeout);
          var q = e.target.value.trim();
          if (q.length < 2) {
            var resultsArea = document.getElementById('search-results-area');
            if (resultsArea) resultsArea.innerHTML = '';
            state.dataRows = [];
            return;
          }
          searchTimeout = setTimeout(function () {
            return _this.executeSearch(q);
          }, 400);
        };
        if (searchInput._searchHandler) {
          searchInput.removeEventListener('input', searchInput._searchHandler);
        }
        searchInput.addEventListener('input', newListener);
        searchInput._searchHandler = newListener;
        searchInput.value = '';
      }
    },
    load: function () {
      var _load = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(isRestore) {
        var _viewArea, viewArea;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.n) {
            case 0:
              if (!(isRestore && state.dataRows && state.dataRows.length > 0)) {
                _context.n = 1;
                break;
              }
              _viewArea = document.getElementById('main-view-area');
              if (_viewArea && !document.getElementById('search-view')) {
                _viewArea.innerHTML = "\n                        <div id=\"search-view\" style=\"padding-bottom: 60px;\">\n                            <div id=\"search-results-area\"></div>\n                        </div>";
              }
              this.render();
              this.updateInputUI();
              return _context.a(2);
            case 1:
              viewArea = document.getElementById('main-view-area');
              if (viewArea) {
                viewArea.innerHTML = "\n                    <div id=\"search-view\" style=\"padding-bottom: 60px;\">\n                        <div id=\"search-results-area\"></div>\n                    </div>";
              }
              state.isInputFocused = true;
              this.updateInputUI();
            case 2:
              return _context.a(2);
          }
        }, _callee, this);
      }));
      function load(_x) {
        return _load.apply(this, arguments);
      }
      return load;
    }(),
    updateInputUI: function updateInputUI() {
      var searchInput = document.getElementById('search-input');
      var searchDropdown = document.getElementById('search-dropdown');
      if (searchInput && searchDropdown) {
        if (state.isInputFocused || App.nav.inMenu && App.nav.focusIndex === 0) {
          searchDropdown.classList.add('search-open');
          searchInput.disabled = false;
          if (state.isInputFocused) {
            searchInput.classList.add('search-focused');
            setTimeout(function () {
              searchInput.focus();
            }, 100);
          } else {
            searchInput.classList.remove('search-focused');
            searchInput.blur();
          }
        } else {
          searchDropdown.classList.remove('search-open');
          searchInput.classList.remove('search-focused');
          searchInput.blur();
          searchInput.disabled = true;
        }
      }
    },
    executeSearch: function () {
      var _executeSearch = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(query) {
        var resultsArea, mySearchSeq, _yield$Promise$all, _yield$Promise$all2, chRes, catRes, channels, categories, liveChannels, allChannels, liveStreams, userIds, streamRes, popularCategories, catPromises, followerPromises, limit, _t3, _t4;
        return _regenerator().w(function (_context4) {
          while (1) switch (_context4.p = _context4.n) {
            case 0:
              resultsArea = document.getElementById('search-results-area');
              if (resultsArea) {
                _context4.n = 1;
                break;
              }
              return _context4.a(2);
            case 1:
              _context4.p = 1;
              state.searchSequence++;
              mySearchSeq = state.searchSequence;
              _context4.n = 2;
              return Promise.all([App.api.twitchFetch("https://api.twitch.tv/helix/search/channels?query=".concat(encodeURIComponent(query), "&first=20")), App.api.twitchFetch("https://api.twitch.tv/helix/search/categories?query=".concat(encodeURIComponent(query), "&first=10"))]);
            case 2:
              _yield$Promise$all = _context4.v;
              _yield$Promise$all2 = _slicedToArray(_yield$Promise$all, 2);
              chRes = _yield$Promise$all2[0];
              catRes = _yield$Promise$all2[1];
              if (!(mySearchSeq !== state.searchSequence)) {
                _context4.n = 3;
                break;
              }
              return _context4.a(2);
            case 3:
              channels = chRes.data || [];
              categories = catRes.data || [];
              liveChannels = channels.filter(function (c) {
                return c.is_live;
              });
              allChannels = channels;
              liveStreams = [];
              if (!(liveChannels.length > 0)) {
                _context4.n = 8;
                break;
              }
              userIds = liveChannels.map(function (c) {
                return "user_id=".concat(c.id);
              }).join('&');
              _context4.p = 4;
              _context4.n = 5;
              return App.api.twitchFetch("https://api.twitch.tv/helix/streams?".concat(userIds));
            case 5:
              streamRes = _context4.v;
              if (!(mySearchSeq !== state.searchSequence)) {
                _context4.n = 6;
                break;
              }
              return _context4.a(2);
            case 6:
              liveStreams = streamRes.data || [];
              _context4.n = 8;
              break;
            case 7:
              _context4.p = 7;
              _t3 = _context4.v;
              console.error("Error fetching live streams", _t3);
            case 8:
              popularCategories = [];
              if (!(categories.length > 0)) {
                _context4.n = 10;
                break;
              }
              catPromises = categories.map(/*#__PURE__*/function () {
                var _ref = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(cat) {
                  var stRes, viewers, _t;
                  return _regenerator().w(function (_context2) {
                    while (1) switch (_context2.p = _context2.n) {
                      case 0:
                        _context2.p = 0;
                        _context2.n = 1;
                        return App.api.twitchFetch("https://api.twitch.tv/helix/streams?game_id=".concat(cat.id, "&first=100"));
                      case 1:
                        stRes = _context2.v;
                        viewers = 0;
                        if (stRes && stRes.data) {
                          viewers = stRes.data.reduce(function (sum, stream) {
                            return sum + stream.viewer_count;
                          }, 0);
                        }
                        cat.viewer_count = viewers;
                        _context2.n = 3;
                        break;
                      case 2:
                        _context2.p = 2;
                        _t = _context2.v;
                        cat.viewer_count = 0;
                      case 3:
                        return _context2.a(2, cat);
                    }
                  }, _callee2, null, [[0, 2]]);
                }));
                return function (_x3) {
                  return _ref.apply(this, arguments);
                };
              }());
              _context4.n = 9;
              return Promise.all(catPromises);
            case 9:
              popularCategories = categories.filter(function (c) {
                return c.viewer_count >= 100;
              });
            case 10:
              if (!(allChannels.length > 0)) {
                _context4.n = 13;
                break;
              }
              followerPromises = allChannels.map(/*#__PURE__*/function () {
                var _ref2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(c) {
                  var folRes, _t2;
                  return _regenerator().w(function (_context3) {
                    while (1) switch (_context3.p = _context3.n) {
                      case 0:
                        _context3.p = 0;
                        _context3.n = 1;
                        return App.api.twitchFetch("https://api.twitch.tv/helix/users/follows?to_id=".concat(c.id));
                      case 1:
                        folRes = _context3.v;
                        c.follower_count = folRes.total || 0;
                        _context3.n = 3;
                        break;
                      case 2:
                        _context3.p = 2;
                        _t2 = _context3.v;
                        c.follower_count = 0;
                      case 3:
                        return _context3.a(2, c);
                    }
                  }, _callee3, null, [[0, 2]]);
                }));
                return function (_x4) {
                  return _ref2.apply(this, arguments);
                };
              }());
              _context4.n = 11;
              return Promise.all(followerPromises);
            case 11:
              if (!(mySearchSeq !== state.searchSequence)) {
                _context4.n = 12;
                break;
              }
              return _context4.a(2);
            case 12:
              allChannels.sort(function (a, b) {
                return b.follower_count - a.follower_count;
              });
            case 13:
              state.dataRows = [];
              limit = App.settings.performanceMode ? 4 : 7;
              if (liveStreams.length > 0) {
                state.dataRows.push({
                  title: App.t('search_live'),
                  type: 'live',
                  data: liveStreams.slice(0, limit)
                });
              }
              if (popularCategories.length > 0) {
                state.dataRows.push({
                  title: App.t('search_categories'),
                  type: 'category',
                  data: popularCategories.slice(0, limit)
                });
              }
              if (allChannels.length > 0) {
                state.dataRows.push({
                  title: App.t('channels'),
                  type: 'channel',
                  data: allChannels.slice(0, limit)
                });
              }
              if (!(state.dataRows.length === 0)) {
                _context4.n = 14;
                break;
              }
              resultsArea.innerHTML = "<div style=\"text-align:center; padding-top:60px; color:#adadb8; font-size:24px;\">Nessun risultato per \"".concat(query, "\"</div>");
              return _context4.a(2);
            case 14:
              if (state.isInputFocused || App.nav.inMenu) {
                state.activeRow = -1;
                state.activeCol = 0;
                state.colIndices = new Array(state.dataRows.length).fill(0);
              }
              this.render();
              _context4.n = 16;
              break;
            case 15:
              _context4.p = 15;
              _t4 = _context4.v;
              console.error(_t4);
              resultsArea.innerHTML = "<div style=\"color:red; text-align:center; padding-top:60px;\">Errore nella ricerca.</div>";
            case 16:
              return _context4.a(2);
          }
        }, _callee4, this, [[4, 7], [1, 15]]);
      }));
      function executeSearch(_x2) {
        return _executeSearch.apply(this, arguments);
      }
      return executeSearch;
    }(),
    render: function render() {
      var resultsArea = document.getElementById('search-results-area');
      if (!resultsArea) return;
      var isLight = document.body.classList.contains('theme-light');
      var titleColor = isLight ? '#000' : 'white';
      var html = "<div style=\"display:flex; flex-direction:column; min-height:calc(100vh - 340px); padding-bottom:40px;\">";
      state.dataRows.forEach(function (row, rIdx) {
        var isLast = rIdx === state.dataRows.length - 1;
        var rowStyle = isLast && state.dataRows.length > 1 ? 'margin-top:auto;' : '';
        html += "<div style=\"".concat(rowStyle, "\">");
        html += "<h3 style=\"color:".concat(titleColor, "; margin: 30px 0 20px 80px; font-size:26px;\">").concat(row.title, "</h3>");
        html += "<div style=\"overflow:hidden; width:100%; position:relative;\">";
        html += "<div id=\"search-row-".concat(rIdx, "\" style=\"display:flex; gap:30px; transition: transform 0.3s ease; padding: 10px 80px;\">");
        row.data.forEach(function (item, cIdx) {
          if (row.type === 'live') {
            var thumb = App.utils.getSafeThumb(item.thumbnail_url, 'stream');
            var viewers = App.utils.formatViewers(item.viewer_count);
            html += "\n                            <div id=\"search-card-".concat(rIdx, "-").concat(cIdx, "\" class=\"channel-card follow-card\" style=\"flex-shrink:0;\">\n                                <div class=\"badge-live\">LIVE</div>\n                                <div class=\"badge-viewers\">").concat(viewers, "</div>\n                                <img src=\"").concat(thumb, "\" loading=\"lazy\" onerror=\"this.src='icon.png'\" style=\"width:100%; height:100%; object-fit:cover;\">\n                                <div class=\"card-info\">\n                                    <div style=\"font-size:22px; font-weight:bold; color:white;\">").concat(item.user_name, "</div>\n                                    <div style=\"font-size:16px; color:#adadb8; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;\">").concat(item.title, "</div>\n                                </div>\n                            </div>");
          } else if (row.type === 'category') {
            var box = item.box_art_url || '';
            var highResBox = App.utils.getSafeThumb(box, 'category');
            html += "\n                            <div class=\"category-card\" id=\"search-card-".concat(rIdx, "-").concat(cIdx, "\" style=\"flex-shrink:0; width:200px; height:266px;\">\n                                <img src=\"").concat(highResBox, "\" loading=\"lazy\" onerror=\"this.src='icon.png'\" style=\"width:100%; height:100%; border-radius:10px; object-fit:cover;\">\n                                <div style=\"margin-top:10px; font-weight:bold; color:").concat(titleColor, "; text-align:center;\">").concat(item.name, "</div>\n                            </div>");
          } else if (row.type === 'channel') {
            var _thumb = item.thumbnail_url || '';
            var highResThumb = App.utils.getSafeThumb(_thumb, 'avatar');
            html += "\n                            <div class=\"search-channel-card\" id=\"search-card-".concat(rIdx, "-").concat(cIdx, "\" style=\"flex-shrink:0; width:350px;\">\n                                <img src=\"").concat(highResThumb, "\" loading=\"lazy\" onerror=\"this.src='icon.png'\" class=\"search-avatar\">\n                                <div class=\"search-info\">\n                                    <div class=\"search-name\">").concat(item.display_name, "</div>\n                                    <div class=\"search-game\">").concat(item.game_name || 'Offline', "</div>\n                                </div>\n                            </div>");
          }
        });
        html += "</div></div></div>";
      });
      html += "</div>";
      resultsArea.innerHTML = html;
      this.updateSelection();
    },
    updateSelection: function updateSelection() {
      document.querySelectorAll('#search-results-area .selected').forEach(function (el) {
        return el.classList.remove('selected');
      });
      if (state.activeRow >= 0 && state.activeCol >= 0) {
        var activeCard = document.getElementById("search-card-".concat(state.activeRow, "-").concat(state.activeCol));
        if (activeCard) {
          activeCard.classList.add('selected');
          var rowDiv = document.getElementById("search-row-".concat(state.activeRow));
          if (rowDiv) {
            var cardWidth = activeCard.offsetWidth + 30; // 30 is gap
            var offset = -(state.activeCol * cardWidth);
            rowDiv.style.transform = "translateX(".concat(offset, "px)");
          }
          activeCard.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    },
    onMenuExit: function onMenuExit() {
      // When user goes down from menu
      state.isInputFocused = true;
      App.nav.inMenu = false;
      this.updateInputUI();
    },
    handleKey: function handleKey(e) {
      if (state.isInputFocused) {
        if (e.keyCode === 13) {
          // "Done" on virtual keyboard
          e.preventDefault();
          document.getElementById('search-input').blur();
          document.body.focus();
          if (state.dataRows.length > 0) {
            state.isInputFocused = false;
            state.activeRow = 0;
            state.activeCol = 0;
            this.updateInputUI();
            this.updateSelection();
          }
          return;
        }
        if (e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
          e.preventDefault();
          var input = document.getElementById('search-input');
          if (document.activeElement === input) {
            input.blur();
            document.body.focus();
          } else {
            state.isInputFocused = false;
            App.nav.inMenu = true;
            App.nav.update();
            this.updateInputUI();
          }
          return;
        }
        if (e.keyCode === 38) {
          e.preventDefault();
          state.isInputFocused = false;
          App.nav.inMenu = true;
          App.nav.update();
          this.updateInputUI();
          return;
        }
        if (e.keyCode === 40 && state.dataRows.length > 0) {
          e.preventDefault();
          state.isInputFocused = false;
          state.activeRow = 0;
          state.activeCol = 0;
          this.updateInputUI();
          this.updateSelection();
          return;
        }
        if (e.keyCode === 37 || e.keyCode === 39) {
          e.stopPropagation();
          return;
        }
        return;
      }

      // Results Navigation
      if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
        state.isInputFocused = true;
        state.activeRow = -1;
        this.updateInputUI();
        this.updateSelection();
        return;
      }
      if (state.dataRows.length === 0 || state.activeRow < 0) {
        if (e.keyCode === 38) {
          state.isInputFocused = true;
          this.updateInputUI();
        }
        return;
      }
      var currentRow = state.dataRows[state.activeRow];
      if (e.keyCode === 39) {
        if (state.activeCol < currentRow.data.length - 1) {
          state.activeCol++;
          state.colIndices[state.activeRow] = state.activeCol;
          this.updateSelection();
        }
      } else if (e.keyCode === 37) {
        if (state.activeCol > 0) {
          state.activeCol--;
          state.colIndices[state.activeRow] = state.activeCol;
          this.updateSelection();
        }
      } else if (e.keyCode === 40) {
        if (state.activeRow < state.dataRows.length - 1) {
          state.activeRow++;
          state.activeCol = state.colIndices[state.activeRow] || 0;
          if (state.activeCol >= state.dataRows[state.activeRow].data.length) {
            state.activeCol = state.dataRows[state.activeRow].data.length - 1;
          }
          this.updateSelection();
        }
      } else if (e.keyCode === 38) {
        if (state.activeRow > 0) {
          state.activeRow--;
          state.activeCol = state.colIndices[state.activeRow] || 0;
          if (state.activeCol >= state.dataRows[state.activeRow].data.length) {
            state.activeCol = state.dataRows[state.activeRow].data.length - 1;
          }
          this.updateSelection();
        } else {
          state.isInputFocused = true;
          state.activeRow = -1;
          this.updateSelection();
          this.updateInputUI();
        }
      } else if (e.keyCode === 13) {
        var item = currentRow.data[state.activeCol];
        if (currentRow.type === 'category') {
          App.nav.navigateTo('category').then(function () {
            if (App.modules.category && App.modules.category.open) {
              App.modules.category.open(item);
            }
          });
        } else if (currentRow.type === 'channel') {
          var login = item.broadcaster_login || item.user_login || item.display_name || item.login;
          App.nav.navigateTo('channel').then(function () {
            if (App.modules.channel && App.modules.channel.openChannelView) {
              App.modules.channel.openChannelView(login);
            }
          });
        } else {
          // Type 'live'
          var _login = item.broadcaster_login || item.user_login || item.display_name || item.user_name;
          App.nav.navigateTo('player').then(function () {
            if (App.modules.player && App.modules.player.openNativePlayer) {
              App.modules.player.openNativePlayer(_login, item.id || '', item.title || '');
            }
          });
        }
      }
    },
    destroy: function destroy() {
      state.searchSequence++;
      var searchInput = document.getElementById('search-input');
      if (searchInput && searchInput._searchHandler) {
        searchInput.removeEventListener('input', searchInput._searchHandler);
        searchInput._searchHandler = null;
      }
      var viewArea = document.getElementById('main-view-area');
      if (viewArea) {
        var images = viewArea.querySelectorAll('img');
        images.forEach(function (img) {
          return img.src = '';
        });
        viewArea.innerHTML = '';
      }

      // Clean UI
      var searchDropdown = document.getElementById('search-dropdown');
      if (searchDropdown) searchDropdown.classList.remove('search-open');
      if (searchInput) {
        searchInput.classList.remove('search-focused');
        searchInput.disabled = true;
      }
    }
  };
})();