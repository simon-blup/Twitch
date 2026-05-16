"use strict";

function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
(function () {
  var state = {
    dataRows: [],
    activeRow: 0,
    activeCol: 0,
    seqId: 0
  };
  App.modules.follow = {
    init: function init() {
      state = {
        dataRows: [],
        activeRow: 0,
        activeCol: 0,
        seqId: Date.now()
      };
    },
    load: function () {
      var _load = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(isRestore) {
        var mySeq, folRes, streams, liveUsers, userIds, userRes, i, va, _t, _t2;
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
              if (App.auth.token) {
                _context.n = 2;
                break;
              }
              this.render();
              return _context.a(2);
            case 2:
              _context.p = 2;
              _context.n = 3;
              return App.api.twitchFetch("https://api.twitch.tv/helix/streams/followed?user_id=".concat(App.auth.userId, "&first=100"), {}, 30);
            case 3:
              folRes = _context.v;
              streams = folRes.data || [];
              liveUsers = [];
              if (!(streams.length > 0 && App.settings.showFollowedAvatars)) {
                _context.n = 7;
                break;
              }
              userIds = streams.map(function (s) {
                return "id=".concat(s.user_id);
              }).join('&');
              _context.p = 4;
              _context.n = 5;
              return App.api.twitchFetch("https://api.twitch.tv/helix/users?".concat(userIds), {}, 60);
            case 5:
              userRes = _context.v;
              if (userRes && userRes.data) {
                liveUsers = userRes.data;
              }
              _context.n = 7;
              break;
            case 6:
              _context.p = 6;
              _t = _context.v;
              console.error("Error fetching live users for follow", _t);
            case 7:
              for (i = 0; i < streams.length; i += 3) {
                state.dataRows.push({
                  type: "stream",
                  data: streams.slice(i, i + 3)
                });
              }
              if (state.dataRows.length === 0) {
                state.dataRows.push({
                  type: "empty",
                  data: [{}]
                });
              }
              if (liveUsers.length > 0) {
                state.dataRows.push({
                  type: "avatars",
                  data: liveUsers
                });
              }
              if (!(mySeq !== state.seqId)) {
                _context.n = 8;
                break;
              }
              return _context.a(2);
            case 8:
              this.render();
              _context.n = 10;
              break;
            case 9:
              _context.p = 9;
              _t2 = _context.v;
              console.error(_t2);
              va = document.getElementById('main-view-area');
              if (va) va.innerHTML = "<div style=\"color:red; text-align:center; padding-top:100px;\">Loading error.</div>";
            case 10:
              return _context.a(2);
          }
        }, _callee, this, [[4, 6], [2, 9]]);
      }));
      function load(_x) {
        return _load.apply(this, arguments);
      }
      return load;
    }(),
    render: function render() {
      var viewArea = document.getElementById('main-view-area');
      if (!viewArea) return;
      var html = '<div id="follow-view" style="padding-top:20px; padding-bottom:60px; display:flex; flex-direction:column; align-items:center; gap:20px;">';
      state.dataRows.forEach(function (row, rowIndex) {
        if (row.type === 'empty') {
          html += "<div style=\"color:white; font-size:30px; margin-top:100px;\">".concat(App.t('no_live'), "</div>");
        } else if (row.type === 'stream') {
          html += "<div id=\"follow-row-".concat(rowIndex, "\" class=\"channel-grid\" style=\"justify-content:flex-start; width: 1830px; gap: 15px;\">");
          row.data.forEach(function (item, colIndex) {
            var thumb = App.utils.getSafeThumb(item.thumbnail_url, 'stream');
            var viewers = App.utils.formatViewers(item.viewer_count);
            html += "\n                            <div id=\"follow-card-".concat(rowIndex, "-").concat(colIndex, "\" class=\"channel-card\">\n                                <div class=\"badge-live\">LIVE</div>\n                                <div class=\"badge-viewers\">").concat(viewers, "</div>\n                                <img src=\"").concat(thumb, "\" loading=\"lazy\" onerror=\"this.src='icon.png'\" style=\"width:100%; height:100%; object-fit:cover;\">\n                                <div class=\"card-info\">\n                                    <div style=\"font-size:22px; font-weight:bold; color:white;\">").concat(item.user_name, "</div>\n                                    <div style=\"font-size:16px; color:#adadb8; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;\">").concat(item.title, "</div>\n                                </div>\n                            </div>");
          });
          html += "</div>";
        } else if (row.type === 'avatars') {
          if (App.settings.showFollowedAvatars) {
            html += "<div class=\"live-avatars-bar\" id=\"follow-row-".concat(rowIndex, "\">");
            row.data.forEach(function (item, colIndex) {
              html += "<img src=\"".concat(item.profile_image_url, "\" id=\"follow-card-").concat(rowIndex, "-").concat(colIndex, "\" class=\"live-avatar-small\" />");
            });
            html += "</div>";
          }
        }
      });
      html += '</div>';
      viewArea.innerHTML = html;
      this.updateSelection();
    },
    updateSelection: function updateSelection() {
      if (state.dataRows.length === 0) return;
      var currentRowData = state.dataRows[state.activeRow];
      document.querySelectorAll('#follow-view .channel-card, #follow-view .live-avatar-small').forEach(function (c) {
        return c.classList.remove('selected');
      });
      if (!App.nav.inMenu && currentRowData && (currentRowData.type === 'stream' || currentRowData.type === 'avatars')) {
        var card = document.getElementById("follow-card-".concat(state.activeRow, "-").concat(state.activeCol));
        if (card) {
          card.classList.add('selected');
        }
        if (currentRowData.type === 'stream') {
          var rowEl = document.getElementById("follow-row-".concat(state.activeRow));
          if (rowEl) rowEl.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        } else {
          if (card) card.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
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
      if (state.dataRows.length === 0) return;
      var currentRowData = state.dataRows[state.activeRow];
      if (currentRowData.type === 'empty') {
        if (e.keyCode === 38) {
          App.nav.inMenu = true;
          App.nav.update();
          this.updateSelection();
        }
        return;
      }
      if (e.keyCode === 39) {
        if (state.activeCol < currentRowData.data.length - 1) state.activeCol++;
        this.updateSelection();
      } else if (e.keyCode === 37) {
        if (state.activeCol > 0) state.activeCol--;
        this.updateSelection();
      } else if (e.keyCode === 40) {
        if (state.activeRow < state.dataRows.length - 1) {
          state.activeRow++;
          if (state.activeCol >= state.dataRows[state.activeRow].data.length) {
            state.activeCol = state.dataRows[state.activeRow].data.length - 1;
          }
          this.updateSelection();
        }
      } else if (e.keyCode === 38) {
        if (state.activeRow > 0) {
          state.activeRow--;
          if (state.activeCol >= state.dataRows[state.activeRow].data.length) {
            state.activeCol = state.dataRows[state.activeRow].data.length - 1;
          }
          this.updateSelection();
        } else {
          App.nav.inMenu = true;
          App.nav.update();
          this.updateSelection();
        }
      } else if (e.keyCode === 13) {
        if (currentRowData.type === 'stream') {
          var selectedStream = currentRowData.data[state.activeCol];
          App.nav.navigateTo('player').then(function () {
            if (App.modules.player && App.modules.player.openNativePlayer) {
              App.modules.player.openNativePlayer(selectedStream.user_name || selectedStream.user_login, selectedStream.user_id, selectedStream.title);
            }
          });
        } else if (currentRowData.type === 'avatars') {
          var selectedAvatar = currentRowData.data[state.activeCol];
          App.nav.navigateTo('channel').then(function () {
            if (App.modules.channel && App.modules.channel.openChannelView) {
              App.modules.channel.openChannelView(selectedAvatar.login);
            }
          });
        }
      }
      if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
        App.nav.inMenu = true;
        App.nav.update();
        this.updateSelection();
      }
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