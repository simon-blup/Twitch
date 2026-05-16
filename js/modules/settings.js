"use strict";

function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
(function () {
  var state = {
    activeTab: 0,
    // 0: Appearance, 1: System
    activeRow: 0,
    inTabs: true
  };
  var tabs = [{
    label: 'tab_appearance',
    icon: "<svg width=\"32\" height=\"32\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\" ry=\"2\"></rect><circle cx=\"8.5\" cy=\"8.5\" r=\"1.5\"></circle><polyline points=\"21 15 16 10 5 21\"></polyline></svg>"
  }, {
    label: 'tab_system',
    icon: "<svg width=\"32\" height=\"32\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"3\"></circle><path d=\"M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z\"></path></svg>"
  }];
  var opts = [[
  // Appearance
  {
    id: 'theme',
    type: 'toggle',
    label: 'setting_theme',
    values: ['dark', 'light']
  }, {
    id: 'barPos',
    type: 'toggle',
    label: 'setting_bar_pos',
    values: ['center', 'left']
  }, {
    id: 'showFollowedAvatars',
    type: 'toggle',
    label: 'setting_avatars'
  }], [
  // System
  {
    id: 'performanceMode',
    type: 'toggle',
    label: 'setting_perf'
  }, {
    id: 'notifications',
    type: 'toggle',
    label: 'setting_notifications'
  }, {
    id: 'adBlock',
    type: 'toggle',
    label: 'setting_adblock'
  }, {
    id: 'language',
    type: 'select',
    label: 'setting_lang',
    values: ['English', 'Italiano', 'Español', '中文', 'Français']
  }, {
    id: 'logout',
    type: 'action',
    label: 'setting_remove',
    color: 'danger'
  }]];
  App.modules.settings = {
    init: function init() {
      state.activeTab = 0;
      state.activeRow = 0;
      state.inTabs = true;
    },
    load: function () {
      var _load = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
        return _regenerator().w(function (_context) {
          while (1) switch (_context.n) {
            case 0:
              this.render();
            case 1:
              return _context.a(2);
          }
        }, _callee, this);
      }));
      function load() {
        return _load.apply(this, arguments);
      }
      return load;
    }(),
    render: function render() {
      var viewArea = document.getElementById('main-view-area');
      if (!viewArea) return;
      var html = "\n                <div id=\"settings-view\" style=\"padding-top: 40px; color: white;\">\n                    <!-- Tabs Menu -->\n                    <div class=\"settings-tabs-container\">\n                        ".concat(tabs.map(function (t, i) {
        return "\n                            <div id=\"set-tab-".concat(i, "\" class=\"settings-tab ").concat(i === state.activeTab ? 'active' : '', "\">\n                                <span style=\"font-size: 32px;\">").concat(t.icon, "</span>\n                                <span>").concat(App.t(t.label), "</span>\n                            </div>\n                        ");
      }).join(''), "\n                    </div>\n                    \n                    <!-- Options List -->\n                    <div class=\"settings-options-container\">\n                        ").concat(opts[state.activeTab].map(function (o, i) {
        var controlHtml = '';
        if (o.type === 'toggle') {
          var isOn = o.values ? App.settings[o.id] === o.values[0] : !!App.settings[o.id];
          controlHtml = "<div class=\"settings-switch ".concat(isOn ? 'on' : '', "\"></div>");
        } else if (o.type === 'select') {
          controlHtml = "\n                                    <div class=\"settings-value-text\">\n                                        <span style=\"opacity: 0.5; font-size: 14px;\">\u25C0</span>\n                                        ".concat(App.settings[o.id], "\n                                        <span style=\"opacity: 0.5; font-size: 14px;\">\u25B6</span>\n                                    </div>");
        }
        return "\n                                <div id=\"set-opt-".concat(i, "\" class=\"settings-row ").concat(o.color === 'danger' ? 'danger' : '', "\">\n                                    <div class=\"settings-label\">").concat(App.t(o.label), "</div>\n                                    ").concat(controlHtml, "\n                                </div>\n                            ");
      }).join(''), "\n                    </div>\n                </div>\n            ");
      viewArea.innerHTML = html;
      this.updateSelection();
    },
    updateSelection: function updateSelection() {
      // Update Tabs
      tabs.forEach(function (t, i) {
        var el = document.getElementById("set-tab-".concat(i));
        if (!el) return;
        el.classList.toggle('active', i === state.activeTab);
        el.classList.toggle('focused', state.inTabs && i === state.activeTab);
      });

      // Update Options
      var currentOpts = opts[state.activeTab];
      currentOpts.forEach(function (o, i) {
        var el = document.getElementById("set-opt-".concat(i));
        if (!el) return;
        el.classList.toggle('focused', !state.inTabs && i === state.activeRow);
      });
    },
    onMenuExit: function onMenuExit() {
      state.inTabs = true;
      this.updateSelection();
    },
    handleKey: function handleKey(e) {
      if (state.inTabs) {
        if (e.keyCode === 39 && state.activeTab < tabs.length - 1) {
          // Right
          state.activeTab++;
          this.render();
        }
        if (e.keyCode === 37 && state.activeTab > 0) {
          // Left
          state.activeTab--;
          this.render();
        }
        if (e.keyCode === 38) {
          // Up to main menu
          App.nav.inMenu = true;
          App.nav.update();
          this.updateSelection();
        }
        if (e.keyCode === 40) {
          // Down to options
          state.inTabs = false;
          state.activeRow = 0;
          this.updateSelection();
        }
      } else {
        var currentLen = opts[state.activeTab].length;
        if (e.keyCode === 40 && state.activeRow < currentLen - 1) {
          // Down
          state.activeRow++;
          this.updateSelection();
        }
        if (e.keyCode === 38) {
          // Up
          if (state.activeRow > 0) {
            state.activeRow--;
            this.updateSelection();
          } else {
            state.inTabs = true;
            this.updateSelection();
          }
        }
        if (e.keyCode === 13 || e.keyCode === 37 || e.keyCode === 39) {
          // Interaction
          var o = opts[state.activeTab][state.activeRow];
          if (o.type === 'toggle') {
            if (e.keyCode === 13) {
              if (o.values) {
                App.settings[o.id] = App.settings[o.id] === o.values[0] ? o.values[1] : o.values[0];
              } else {
                App.settings[o.id] = !App.settings[o.id];
              }
            }
          } else if (o.type === 'select') {
            var currIdx = o.values.indexOf(App.settings[o.id]);
            if (currIdx === -1) currIdx = 0;
            if (e.keyCode === 39 || e.keyCode === 13) {
              currIdx = (currIdx + 1) % o.values.length;
            } else if (e.keyCode === 37) {
              currIdx = (currIdx - 1 + o.values.length) % o.values.length;
            }
            App.settings[o.id] = o.values[currIdx];
          } else if (o.type === 'action') {
            if (e.keyCode === 13) {
              if (o.id === 'logout') {
                App.authManager.logout();
                return;
              }
            }
          }
          App.utils.saveSettings();
          this.render();
        }
      }
      if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
        if (!state.inTabs) {
          state.inTabs = true;
          this.updateSelection();
        } else {
          App.nav.inMenu = true;
          App.nav.update();
          this.updateSelection();
        }
      }
    },
    destroy: function destroy() {
      var viewArea = document.getElementById('main-view-area');
      if (viewArea) viewArea.innerHTML = '';
    }
  };
})();