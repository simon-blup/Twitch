"use strict";

function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
(function () {
  var state = {
    isPolling: false,
    pollInterval: null,
    deviceCode: '',
    userCode: '',
    statusMsg: '',
    activeRow: 0 // 0: accounts list, length: add account
  };
  App.modules.profile = {
    init: function init() {
      state.isPolling = false;
      clearInterval(state.pollInterval);
      state.deviceCode = '';
      state.userCode = '';
      state.statusMsg = '';
      state.activeRow = 0;
    },
    load: function () {
      var _load = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
        return _regenerator().w(function (_context) {
          while (1) switch (_context.n) {
            case 0:
              if (App.auth.token) {
                this.renderAuthenticated();
              } else {
                this.startDeviceFlow();
              }
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
    startDeviceFlow: function () {
      var _startDeviceFlow = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
        var res, data, _t;
        return _regenerator().w(function (_context2) {
          while (1) switch (_context2.p = _context2.n) {
            case 0:
              this.renderUnauthenticated(App.t('login_request').toUpperCase());
              _context2.p = 1;
              _context2.n = 2;
              return fetch('https://id.twitch.tv/oauth2/device', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: "client_id=".concat(window.CLIENT_ID, "&scopes=user:read:follows")
              });
            case 2:
              res = _context2.v;
              _context2.n = 3;
              return res.json();
            case 3:
              data = _context2.v;
              if (data.device_code) {
                state.deviceCode = data.device_code;
                state.userCode = data.user_code;
                this.renderUnauthenticated();
                this.pollForToken(data.interval);
              } else {
                this.renderUnauthenticated(App.t('login_error').toUpperCase());
              }
              _context2.n = 5;
              break;
            case 4:
              _context2.p = 4;
              _t = _context2.v;
              this.renderUnauthenticated(App.t('login_network_error').toUpperCase());
            case 5:
              return _context2.a(2);
          }
        }, _callee2, this, [[1, 4]]);
      }));
      function startDeviceFlow() {
        return _startDeviceFlow.apply(this, arguments);
      }
      return startDeviceFlow;
    }(),
    pollForToken: function pollForToken(interval) {
      var _this = this;
      state.isPolling = true;
      state.pollInterval = setInterval(/*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
        var res, data, valRes, valData, newProfile, _t2;
        return _regenerator().w(function (_context3) {
          while (1) switch (_context3.p = _context3.n) {
            case 0:
              if (state.isPolling) {
                _context3.n = 1;
                break;
              }
              return _context3.a(2);
            case 1:
              _context3.p = 1;
              _context3.n = 2;
              return fetch('https://id.twitch.tv/oauth2/token', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: "client_id=".concat(window.CLIENT_ID, "&scopes=user:read:follows&device_code=").concat(state.deviceCode, "&grant_type=urn:ietf:params:oauth:grant-type:device_code")
              });
            case 2:
              res = _context3.v;
              _context3.n = 3;
              return res.json();
            case 3:
              data = _context3.v;
              if (!data.access_token) {
                _context3.n = 6;
                break;
              }
              clearInterval(state.pollInterval);
              state.isPolling = false;
              _context3.n = 4;
              return fetch('https://id.twitch.tv/oauth2/validate', {
                headers: {
                  'Authorization': 'OAuth ' + data.access_token
                }
              });
            case 4:
              valRes = _context3.v;
              _context3.n = 5;
              return valRes.json();
            case 5:
              valData = _context3.v;
              newProfile = {
                id: valData.user_id,
                login: valData.login,
                token: data.access_token,
                refresh: data.refresh_token
              };
              App.profiles = App.profiles.filter(function (p) {
                return p.id !== newProfile.id;
              });
              App.profiles.push(newProfile);
              App.activeProfileId = newProfile.id;
              localStorage.setItem('twitch_profiles', JSON.stringify(App.profiles));
              localStorage.setItem('active_profile_id', App.activeProfileId);
              App.authManager.loadProfiles();
              if (App.notifications && typeof App.notifications.init === 'function') {
                App.notifications.init();
              }

              // Navigazione in Home con MENU ATTIVO
              App.nav.focusIndex = 1; // Home
              App.nav.inMenu = true;
              App.nav.update();
              App.nav.navigateTo('home');
              _context3.n = 7;
              break;
            case 6:
              if (data.message !== 'authorization_pending') {
                clearInterval(state.pollInterval);
                state.isPolling = false;
                _this.renderUnauthenticated(App.t('login_expired').toUpperCase());
              }
            case 7:
              _context3.n = 9;
              break;
            case 8:
              _context3.p = 8;
              _t2 = _context3.v;
              console.error("Polling error", _t2);
            case 9:
              return _context3.a(2);
          }
        }, _callee3, null, [[1, 8]]);
      })), interval * 1000);
    },
    renderUnauthenticated: function renderUnauthenticated(msg) {
      var viewArea = document.getElementById('main-view-area');
      if (!viewArea) return;
      var html = "\n                <div style=\"display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; width:100vw; position:fixed; top:0; left:0; background:#0e0e10; color:white; text-align:center; z-index:1000;\">\n                    <!-- Logo in alto adattivo -->\n                    <img src=\"icon.png\" style=\"width:100px; position:absolute; top:".concat(App.nav.inMenu ? '140px' : '60px', "; transition: 0.3s;\">\n                    \n                    ").concat(state.userCode ? "\n                        <div style=\"position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center; margin-top:".concat(App.nav.inMenu ? '80px' : '0px', "; transition: 0.3s;\">\n                            <div style=\"position:absolute; left:25%; transform:translateX(-50%); background:white; padding:15px; border-radius:15px; box-shadow: 0 0 30px rgba(145, 70, 255, 0.3);\">\n                                <img src=\"https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=").concat(encodeURIComponent('https://www.twitch.tv/activate?device-code=' + state.userCode), "\" style=\"width:180px; height:180px; display:block;\">\n                            </div>\n                            <div style=\"background:#18181b; padding:40px 60px; border-radius:30px; border:4px solid #bf94ff; box-shadow: 0 0 50px rgba(145, 70, 255, 0.2);\">\n                                <div style=\"font-size:80px; font-weight:bold; letter-spacing:12px; margin-bottom:15px;\">").concat(state.userCode, "</div>\n                                <div style=\"font-size:32px; color:#bf94ff; font-weight:bold; letter-spacing:2px;\">twitch.tv/activate</div>\n                            </div>\n                        </div>\n                    ") : "\n                        <div style=\"display:flex; align-items:center; justify-content:center; height:100%;\">\n                            <div style=\"font-size:28px; color:#adadb8; font-weight:300; letter-spacing:2px;\">".concat(msg || App.t('loading').toUpperCase(), "</div>\n                        </div>\n                    "), "\n                </div>\n            ");
      viewArea.innerHTML = html;
    },
    renderAuthenticated: function () {
      var _renderAuthenticated = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4() {
        var viewArea, cacheKey, cachedProfiles, profiles;
        return _regenerator().w(function (_context4) {
          while (1) switch (_context4.n) {
            case 0:
              viewArea = document.getElementById('main-view-area');
              if (viewArea) {
                _context4.n = 1;
                break;
              }
              return _context4.a(2);
            case 1:
              // Usa la cache se disponibile per un rendering istantaneo
              cacheKey = 'profiles_data';
              cachedProfiles = App.stateCache[cacheKey];
              if (!cachedProfiles) {
                _context4.n = 2;
                break;
              }
              // Rendering immediato dalla RAM per eliminare il loading
              this.drawProfiles(viewArea, cachedProfiles);
              // Aggiornamento silenzioso in background senza mostrare caricamenti
              this.updateProfilesInBackground(viewArea, cacheKey);
              _context4.n = 4;
              break;
            case 2:
              // Prima volta in assoluto: mostriamo il loading al centro
              viewArea.innerHTML = "<div style=\"display:flex; justify-content:center; align-items:center; height:100vh; width:100vw; font-size:24px; color:#adadb8;\">".concat(App.t('loading').toUpperCase(), "</div>");
              _context4.n = 3;
              return this.fetchProfilesData();
            case 3:
              profiles = _context4.v;
              App.stateCache[cacheKey] = profiles;
              this.drawProfiles(viewArea, profiles);
            case 4:
              return _context4.a(2);
          }
        }, _callee4, this);
      }));
      function renderAuthenticated() {
        return _renderAuthenticated.apply(this, arguments);
      }
      return renderAuthenticated;
    }(),
    fetchProfilesData: function () {
      var _fetchProfilesData = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5() {
        var profilesWithAvatars, ids, res, _t3;
        return _regenerator().w(function (_context5) {
          while (1) switch (_context5.p = _context5.n) {
            case 0:
              profilesWithAvatars = JSON.parse(JSON.stringify(App.profiles));
              _context5.p = 1;
              ids = App.profiles.map(function (p) {
                return p.id;
              }).join('&id=');
              if (!ids) {
                _context5.n = 3;
                break;
              }
              _context5.n = 2;
              return App.api.twitchFetch("https://api.twitch.tv/helix/users?id=".concat(ids));
            case 2:
              res = _context5.v;
              if (res && res.data) {
                res.data.forEach(function (userData) {
                  var p = profilesWithAvatars.find(function (prof) {
                    return prof.id === userData.id;
                  });
                  if (p) p.avatar = userData.profile_image_url;
                });
              }
            case 3:
              _context5.n = 5;
              break;
            case 4:
              _context5.p = 4;
              _t3 = _context5.v;
              console.error("Error fetching avatars", _t3);
            case 5:
              return _context5.a(2, profilesWithAvatars);
          }
        }, _callee5, null, [[1, 4]]);
      }));
      function fetchProfilesData() {
        return _fetchProfilesData.apply(this, arguments);
      }
      return fetchProfilesData;
    }(),
    updateProfilesInBackground: function () {
      var _updateProfilesInBackground = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6(viewArea, cacheKey) {
        var freshProfiles;
        return _regenerator().w(function (_context6) {
          while (1) switch (_context6.n) {
            case 0:
              _context6.n = 1;
              return this.fetchProfilesData();
            case 1:
              freshProfiles = _context6.v;
              // Confronta se ci sono cambiamenti reali prima di ridisegnare per evitare sfarfallio
              if (JSON.stringify(freshProfiles) !== JSON.stringify(App.stateCache[cacheKey])) {
                App.stateCache[cacheKey] = freshProfiles;
                // Ridisegna solo se siamo ancora in questa vista e non nel menu
                if (!App.nav.inMenu) this.drawProfiles(viewArea, freshProfiles);
              }
            case 2:
              return _context6.a(2);
          }
        }, _callee6, this);
      }));
      function updateProfilesInBackground(_x, _x2) {
        return _updateProfilesInBackground.apply(this, arguments);
      }
      return updateProfilesInBackground;
    }(),
    drawProfiles: function drawProfiles(viewArea, profiles) {
      // Se il carosello esiste già, aggiorniamo solo le posizioni per permettere la transizione CSS
      var existingTitle = document.getElementById('profile-title');
      var existingCarousel = document.getElementById('profiles-carousel');
      if (existingTitle && existingCarousel) {
        existingTitle.style.top = App.nav.inMenu ? '140px' : '80px';
        existingCarousel.style.marginTop = App.nav.inMenu ? '100px' : '0px';
        this.updateSelection();
        return;
      }
      var html = "\n                <div style=\"display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; width:100vw; color:white; overflow:hidden; position:fixed; top:0; left:0;\">\n                    <!-- Titolo adattivo con transizione sincronizzata (0.5s) -->\n                    <h2 id=\"profile-title\" style=\"position:absolute; top:".concat(App.nav.inMenu ? '140px' : '80px', "; font-size:38px; font-weight:bold; letter-spacing:2px; color:#efeff1; transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);\">\n                        ").concat(App.t('accounts_title').toUpperCase(), "\n                    </h2>\n                    \n                    <!-- Carosello centrato con transizione sincronizzata (0.5s) -->\n                    <div id=\"profiles-carousel\" style=\"display:flex; align-items:flex-start; justify-content:center; gap:50px; padding:20px; margin-top:").concat(App.nav.inMenu ? '100px' : '0px', "; transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);\">\n                        ").concat(profiles.map(function (p, i) {
        return "\n                            <div id=\"prof-opt-".concat(i, "\" class=\"profile-card\" style=\"display:flex; flex-direction:column; align-items:center; width:220px; transition:0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); position:relative;\">\n                                <div class=\"avatar-container\" style=\"width:180px; height:180px; border-radius:50%; border:6px solid ").concat(p.id === App.activeProfileId ? '#bf94ff' : 'transparent', "; overflow:hidden; margin-bottom:25px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); transition: 0.3s;\">\n                                    <img src=\"").concat(p.avatar || 'icon.png', "\" style=\"width:100%; height:100%; object-fit:cover;\">\n                                </div>\n                                <div style=\"font-size:26px; font-weight:bold; text-align:center; width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;\">").concat(p.login, "</div>\n                                ").concat(p.id === App.activeProfileId ? "<div style=\"position:absolute; top:-10px; right:20px; background:#bf94ff; color:white; width:35px; height:35px; display:flex; align-items:center; justify-content:center; border-radius:50%; font-size:20px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); border:3px solid #0e0e10;\">\u2714</div>" : '', "\n                            </div>\n                        ");
      }).join(''), "\n                        \n                        <div id=\"prof-opt-").concat(App.profiles.length, "\" class=\"profile-card\" style=\"display:flex; flex-direction:column; align-items:center; width:220px; transition:0.3s;\">\n                            <div class=\"avatar-container\" style=\"width:180px; height:180px; border-radius:50%; background:#1f1f23; border:6px dashed #3a3a3d; display:flex; align-items:center; justify-content:center; margin-bottom:25px; transition: 0.3s;\">\n                                <div style=\"font-size:80px; color:#adadb8; font-weight:100;\">+</div>\n                            </div>\n                            <div style=\"font-size:26px; font-weight:bold; color:#adadb8;\">").concat(App.t('add_account').toUpperCase(), "</div>\n                        </div>\n                    </div>\n                </div>\n            ");
      viewArea.innerHTML = html;
      this.updateSelection();
    },
    updateSelection: function updateSelection() {
      if (!App.auth.token) return;
      document.querySelectorAll('.profile-card').forEach(function (el, i) {
        var container = el.querySelector('.avatar-container');
        if (!App.nav.inMenu && i === state.activeRow) {
          el.style.transform = 'scale(1.15)';
          container.style.borderColor = 'white';
          container.style.boxShadow = '0 15px 40px rgba(145, 70, 255, 0.4)';
          el.style.zIndex = '10';
        } else {
          el.style.transform = 'scale(1)';
          var isActuallyActive = i < App.profiles.length && App.profiles[i].id === App.activeProfileId;
          container.style.borderColor = isActuallyActive ? '#bf94ff' : 'transparent';
          container.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
          el.style.zIndex = '1';
        }
      });
    },
    onMenuExit: function onMenuExit() {
      this.renderAuthenticated(); // Forza re-render per adattare il layout al menu nascosto
    },
    handleKey: function handleKey(e) {
      // Se siamo nella schermata del codice
      if (!App.auth.token) {
        // Permettiamo di tornare indietro solo se c'è almeno un account salvato
        if (App.profiles.length > 0) {
          if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
            state.isPolling = false;
            clearInterval(state.pollInterval);
            App.authManager.loadProfiles();
            this.renderAuthenticated();
            return;
          }
        }
        return;
      }
      var maxRow = App.profiles.length;
      if (e.keyCode === 39 && state.activeRow < maxRow) {
        state.activeRow++;
        this.updateSelection();
      }
      if (e.keyCode === 37 && state.activeRow > 0) {
        state.activeRow--;
        this.updateSelection();
      }
      if (e.keyCode === 38) {
        if (App.isStartupProfileSelect) {
          return; // Blocca l'apertura del menu all'avvio
        }
        App.nav.inMenu = true;
        App.nav.update();
        this.renderAuthenticated(); // Adatta il layout alla comparsa del menu
      }
      if (e.keyCode === 13) {
        if (state.activeRow < App.profiles.length) {
          var clickedProfile = App.profiles[state.activeRow];
          App.activeProfileId = clickedProfile.id;
          localStorage.setItem('active_profile_id', App.activeProfileId);
          App.authManager.loadProfiles();
          if (App.notifications && typeof App.notifications.init === 'function') {
            App.notifications.init();
          }
          App.isStartupProfileSelect = false; // Avvio completato

          // Vai in Home MENU (menu attivo)
          App.nav.focusIndex = 1; // Home
          App.nav.inMenu = true;
          App.nav.update();
          App.nav.navigateTo('home');
        } else {
          state.isPolling = false;
          clearInterval(state.pollInterval);
          App.auth.token = '';
          this.startDeviceFlow();
        }
      }
      if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
        if (App.isStartupProfileSelect) {
          if (App.ExitMenu) {
            App.ExitMenu.show();
          }
          return;
        }
        App.nav.inMenu = true;
        App.nav.update();
        this.renderAuthenticated();
      }
    },
    destroy: function destroy() {
      state.isPolling = false;
      clearInterval(state.pollInterval);
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