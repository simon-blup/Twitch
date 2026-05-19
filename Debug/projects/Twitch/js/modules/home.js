"use strict";

function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
(function () {
  var state = {
    dataRows: [],
    activeRow: 0,
    colIndices: [],
    originalHeroCount: 0,
    seqId: 0
  };
  App.modules.home = {
    init: function init() {
      state = {
        dataRows: [],
        activeRow: 0,
        colIndices: [],
        originalHeroCount: 0,
        seqId: Date.now()
      };
    },
    load: function () {
      var _load = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(isRestore) {
        var mySeq, recRes, loopedData, folRes, catRes, va, _t;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.p = _context.n) {
            case 0:
              if (!(isRestore && state.dataRows.length > 0)) {
                _context.n = 1;
                break;
              }
              this.render();
              return _context.a(2);
            case 1:
              mySeq = state.seqId;
              _context.p = 2;
              _context.n = 3;
              return App.api.twitchFetch('https://api.twitch.tv/helix/streams?first=10', {}, 60);
            case 3:
              recRes = _context.v;
              if (recRes.data && recRes.data.length > 0) {
                state.originalHeroCount = recRes.data.length;
                loopedData = [].concat(_toConsumableArray(recRes.data), _toConsumableArray(recRes.data), _toConsumableArray(recRes.data));
                state.dataRows.push({
                  title: "",
                  type: "stream",
                  data: loopedData,
                  isHero: true
                });
              }

              // 2. Followed Channels
              if (App.settings.performanceMode) {
                _context.n = 5;
                break;
              }
              if (!(App.auth.userId && App.auth.token)) {
                _context.n = 5;
                break;
              }
              _context.n = 4;
              return App.api.twitchFetch("https://api.twitch.tv/helix/streams/followed?user_id=".concat(App.auth.userId, "&first=10"), {}, 30);
            case 4:
              folRes = _context.v;
              if (folRes.data && folRes.data.length > 0) {
                state.dataRows.push({
                  title: App.t('live_recom'),
                  type: 'stream',
                  data: folRes.data
                });
              } else {
                state.dataRows.push({
                  title: App.t('followed_channels'),
                  type: 'stream',
                  data: []
                });
              }
            case 5:
              _context.n = 6;
              return App.api.twitchFetch('https://api.twitch.tv/helix/games/top?first=10', {}, 120);
            case 6:
              catRes = _context.v;
              if (catRes.data && catRes.data.length > 0) {
                state.dataRows.push({
                  title: App.t('top_cats'),
                  type: 'category',
                  data: catRes.data
                });
              }
              if (!(mySeq !== state.seqId)) {
                _context.n = 7;
                break;
              }
              return _context.a(2);
            case 7:
              state.colIndices = new Array(state.dataRows.length).fill(0);
              if (state.dataRows[0] && state.dataRows[0].isHero) {
                state.colIndices[0] = state.originalHeroCount;
              }
              this.render();
              _context.n = 10;
              break;
            case 8:
              _context.p = 8;
              _t = _context.v;
              if (!(mySeq !== state.seqId)) {
                _context.n = 9;
                break;
              }
              return _context.a(2);
            case 9:
              console.error("Home API Error", _t);
              va = document.getElementById('main-view-area');
              if (va) va.innerHTML = "<div style=\"color:red; text-align:center; padding-top:100px;\">".concat(App.t('loading_error'), "</div>");
            case 10:
              return _context.a(2);
          }
        }, _callee, this, [[2, 8]]);
      }));
      function load(_x) {
        return _load.apply(this, arguments);
      }
      return load;
    }(),
    render: function render() {
      var viewArea = document.getElementById('main-view-area');
      if (!viewArea) return;
      var isLight = document.body.classList.contains('theme-light');
      var titleColor = isLight ? '#000' : 'white';
      var html = '<div id="home-view" style="padding-bottom:60px;">';
      state.dataRows.forEach(function (row, rowIndex) {
        if (row.title) {
          html += "<h3 style=\"color:".concat(titleColor, "; margin-left:80px; margin-bottom:30px; font-size:26px;\">").concat(row.title, "</h3>");
        }
        var gridClass = row.isHero ? 'channel-grid hero-grid' : 'channel-grid';
        var wrapperStyle = 'width:100%; overflow:visible; perspective:1200px; margin-bottom:40px;';
        html += "\n                    <div style=\"".concat(wrapperStyle, "\">\n                        <div id=\"row-").concat(rowIndex, "\" class=\"").concat(gridClass, "\"></div>\n                    </div>\n                ");
      });
      html += '</div>';
      viewArea.innerHTML = html;
      state.dataRows.forEach(function (row, rowIndex) {
        var rowDiv = document.getElementById("row-".concat(rowIndex));
        if (!rowDiv) return;
        if (row.type === 'category') {
          row.data.forEach(function (item) {
            var card = document.createElement('div');
            card.className = 'category-card';
            var thumb = App.utils.getSafeThumb(item.box_art_url, 'category');
            card.innerHTML = "\n                            <img src=\"".concat(thumb, "\" loading=\"lazy\" onerror=\"this.src='icon.png'\" style=\"width:100%; height:100%; object-fit:cover;\">\n                            <div class=\"card-info\"><div style=\"font-size:20px; font-weight:bold; color:white;\">").concat(item.name, "</div></div>");
            rowDiv.appendChild(card);
          });
        } else if (row.type === 'stream') {
          row.data.forEach(function (item) {
            var card = document.createElement('div');
            card.className = row.isHero ? 'channel-card hero-card' : 'channel-card';
            var thumb = App.utils.getSafeThumb(item.thumbnail_url, 'stream');
            var viewers = App.utils.formatViewers(item.viewer_count);
            card.innerHTML = "\n                            <div class=\"badge-live\">".concat(App.t('live_badge'), "</div>\n                            <div class=\"badge-viewers\">").concat(viewers, "</div>\n                            <img src=\"").concat(thumb, "\" loading=\"lazy\" onerror=\"this.src='icon.png'\" style=\"width:100%; height:100%; object-fit:cover;\">\n                            <div class=\"card-info\">\n                                <div style=\"font-size:").concat(row.isHero ? '28' : '22', "px; font-weight:bold; color:white;\">").concat(item.user_name, "</div>\n                                <div style=\"font-size:").concat(row.isHero ? '18' : '16', "px; color:#adadb8; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;\">").concat(item.title, "</div>\n                            </div>");
            rowDiv.appendChild(card);
          });
        }
      });

      // Prevent transitions on first render
      state.dataRows.forEach(function (row, rowIndex) {
        var rowDiv = document.getElementById("row-".concat(rowIndex));
        if (!rowDiv) return;
        rowDiv.style.transition = 'none';
        var cards = rowDiv.querySelectorAll('.channel-card, .category-card');
        cards.forEach(function (c) {
          return c.style.transition = 'none';
        });
      });
      this.updateSelection();
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          state.dataRows.forEach(function (row, rowIndex) {
            var rowDiv = document.getElementById("row-".concat(rowIndex));
            if (!rowDiv) return;
            rowDiv.style.transition = '';
            var cards = rowDiv.querySelectorAll('.channel-card, .category-card');
            cards.forEach(function (c) {
              return c.style.transition = '';
            });
          });
        });
      });
    },
    updateSelection: function updateSelection() {
      var centerX = window.innerWidth / 2;
      var gap = 20;
      state.dataRows.forEach(function (row, rowIndex) {
        var rowDiv = document.getElementById("row-".concat(rowIndex));
        if (!rowDiv) return;
        var currentColIdx = state.colIndices[rowIndex];
        var isActiveRow = !App.nav.inMenu && state.activeRow === rowIndex;
        var cards = rowDiv.querySelectorAll(row.type === 'category' ? '.category-card' : '.channel-card');
        cards.forEach(function (c, i) {
          c.classList.remove('selected', 'hero-adjacent', 'hero-center');
          if (row.isHero) {
            if (i === currentColIdx) {
              c.classList.add('hero-center');
              if (isActiveRow) c.classList.add('selected');
            } else if (i === currentColIdx - 1 || i === currentColIdx + 1) {
              c.classList.add('hero-adjacent');
            }
          } else {
            c.classList.toggle('selected', isActiveRow && i === currentColIdx);
          }
        });
        if (cards.length > 0) {
          var cardWidth, offset;
          if (row.isHero) {
            cardWidth = 800 + gap;
            offset = centerX - 400 - currentColIdx * cardWidth;
          } else if (row.type === 'stream') {
            cardWidth = 600 + gap;
            offset = 80 - currentColIdx * cardWidth;
          } else if (row.type === 'category') {
            cardWidth = 300 + gap;
            offset = 80 - currentColIdx * cardWidth;
          }
          rowDiv.style.transform = "translateX(".concat(offset, "px)");
        }
      });
      if (!App.nav.inMenu) {
        var rowEl = document.getElementById("row-".concat(state.activeRow));
        if (rowEl && rowEl.parentElement) {
          rowEl.parentElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      } else {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    },
    onMenuExit: function onMenuExit() {
      this.updateSelection();
    },
    handleKey: function handleKey(e) {
      var _this = this;
      if (state.dataRows.length === 0) return;
      var currentRowData = state.dataRows[state.activeRow];
      if (!currentRowData) return;
      var currentLen = currentRowData.data.length;
      if (e.keyCode === 39) {
        // Right
        state.colIndices[state.activeRow]++;
        if (currentRowData.isHero) {
          this.updateSelection();
          if (state.colIndices[state.activeRow] >= state.originalHeroCount * 2) {
            setTimeout(function () {
              if (state.colIndices[state.activeRow] >= state.originalHeroCount * 2) {
                var rowDiv = document.getElementById("row-".concat(state.activeRow));
                if (rowDiv) {
                  var cards = rowDiv.querySelectorAll('.channel-card');
                  rowDiv.style.transition = 'none';
                  cards.forEach(function (c) {
                    return c.style.transition = 'none';
                  });
                  state.colIndices[state.activeRow] -= state.originalHeroCount;
                  _this.updateSelection();
                  rowDiv.offsetHeight; // force reflow
                  rowDiv.style.transition = '';
                  cards.forEach(function (c) {
                    return c.style.transition = '';
                  });
                }
              }
            }, 750);
          }
        } else if (state.colIndices[state.activeRow] >= currentLen) {
          state.colIndices[state.activeRow] = currentLen - 1;
          this.updateSelection();
        } else {
          this.updateSelection();
        }
      }
      if (e.keyCode === 37) {
        // Left
        state.colIndices[state.activeRow]--;
        if (currentRowData.isHero) {
          if (state.colIndices[state.activeRow] < 0) state.colIndices[state.activeRow] = 0;
          this.updateSelection();
          if (state.colIndices[state.activeRow] < state.originalHeroCount) {
            setTimeout(function () {
              if (state.colIndices[state.activeRow] < state.originalHeroCount) {
                var rowDiv = document.getElementById("row-".concat(state.activeRow));
                if (rowDiv) {
                  var cards = rowDiv.querySelectorAll('.channel-card');
                  rowDiv.style.transition = 'none';
                  cards.forEach(function (c) {
                    return c.style.transition = 'none';
                  });
                  state.colIndices[state.activeRow] += state.originalHeroCount;
                  _this.updateSelection();
                  rowDiv.offsetHeight; // force reflow
                  rowDiv.style.transition = '';
                  cards.forEach(function (c) {
                    return c.style.transition = '';
                  });
                }
              }
            }, 750);
          }
        } else if (state.colIndices[state.activeRow] < 0) {
          state.colIndices[state.activeRow] = 0;
          this.updateSelection();
        } else {
          this.updateSelection();
        }
      }
      if (e.keyCode === 40 && state.activeRow < state.dataRows.length - 1) {
        state.activeRow++;
        this.updateSelection();
      }
      if (e.keyCode === 38) {
        if (state.activeRow > 0) {
          state.activeRow--;
          this.updateSelection();
        } else {
          App.nav.inMenu = true;
          App.nav.update();
          this.updateSelection();
        }
      }
      if (e.keyCode === 13) {
        // Enter
        if (currentRowData.type === 'category') {
          var selectedCategory = currentRowData.data[state.colIndices[state.activeRow]];
          App.nav.navigateTo('category').then(function () {
            if (App.modules.category && App.modules.category.open) {
              App.modules.category.open(selectedCategory);
            }
          });
        } else if (currentRowData.type === 'stream') {
          var selectedStream = currentRowData.data[state.colIndices[state.activeRow]];
          App.nav.navigateTo('player').then(function () {
            if (App.modules.player && App.modules.player.openNativePlayer) {
              App.modules.player.openNativePlayer(selectedStream.user_login || selectedStream.user_name, selectedStream.user_id, selectedStream.title);
            }
          });
        }
      }
      if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
        // Return -> we should show exit menu, but for now we let it go to menu or implement exit menu logic in core
        App.nav.inMenu = true;
        App.nav.update();
        this.updateSelection();
      }
    },
    destroy: function destroy() {
      state.seqId++; // invalidate pending fetches
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