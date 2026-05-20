window.CLIENT_ID = '9g8h4ha9stbc9r76624evvlx4bzk39';

window.App = {
    modules: {},
    currentModule: null,
    previousModule: null,
    stateCache: {}, 
    apiCache: {}, 

    settings: {
        barPos: 'center', theme: 'dark', performanceMode: false,
        notifications: true, adBlock: true, language: 'English',
        showFollowedAvatars: true
    },

    profiles: [],
    activeProfileId: '',
    auth: { token: '', refresh: '', userId: '' },
    notifications: {
        lastLiveStreamIds: null,
        isFirstCheck: true,
        pollInterval: null,

        init: function() {
            var self = this;
            if (this.pollInterval) clearInterval(this.pollInterval);
            this.isFirstCheck = true;
            this.lastLiveStreamIds = {}; 
            
            this.pollInterval = setInterval(function() { self.check(); }, 30000);
            setTimeout(function() { self.check(); }, 5000);
        },

        check: function() {
            var self = this;
            if (!App.auth.token || !App.auth.userId || !App.settings.notifications) return;
            
            App.api.twitchFetch('https://api.twitch.tv/helix/streams/followed?user_id=' + App.auth.userId + '&first=100')
                .then(function(res) {
                    var currentStreams = res.data || [];
                    var currentIds = {};
                    currentStreams.forEach(function(s) { currentIds[s.user_id] = true; });

                    if (self.isFirstCheck) {
                        self.lastLiveStreamIds = currentIds;
                        self.isFirstCheck = false;
                        return;
                    }

                    var newLiveStreams = currentStreams.filter(function(s) { 
                        return !self.lastLiveStreamIds[s.user_id]; 
                    });

                    if (newLiveStreams.length > 0) {
                        var userIds = newLiveStreams.map(function(s) { return 'id=' + s.user_id; }).join('&');
                        App.api.twitchFetch('https://api.twitch.tv/helix/users?' + userIds)
                            .then(function(userRes) {
                                var userData = userRes.data || [];
                                newLiveStreams.forEach(function(stream) {
                                    var user = userData.filter(function(u) { return u.id === stream.user_id; })[0];
                                    var profileImg = user ? user.profile_image_url : null;
                                    self.show(stream.user_name, stream.title, profileImg);
                                });
                            });
                    }
                    self.lastLiveStreamIds = currentIds;
                })
                .catch(function(e) {
                    console.error("Error checking live followed streams:", e);
                });
        },

        show: function(userName, title, profileImg) {
            var container = document.getElementById('notification-container');
            if (!container) return;

            var notif = document.createElement('div');
            notif.className = 'notification';

            var iconHtml = '<div class="notification-icon">' +
                '<svg viewBox="0 0 24 24" width="30" height="30" fill="white">' +
                    '<path d="M2.149 0l-1.612 4.119v16.836h5.731v3.045h3.224l3.045-3.045h4.657l6.269-6.269v-14.686h-21.314zm19.164 13.612l-3.582 3.582h-5.731l-3.045 3.045v-3.045h-4.836v-15.045h17.194v11.463zm-3.582-7.343v4.836h-2.149v-4.836h2.149zm-5.731 0v4.836h-2.149v-4.836h2.149z" />' +
                '</svg>' +
            '</div>';

            if (profileImg) {
                iconHtml = '<img src="' + profileImg + '" class="notification-avatar">';
            }

            notif.innerHTML = iconHtml +
                '<div class="notification-content">' +
                    '<div class="notification-title">' + userName + ' is now LIVE!</div>' +
                    '<div class="notification-msg">' + title + '</div>' +
                '</div>';

            container.appendChild(notif);

            setTimeout(function() {
                if (notif.parentNode) {
                    notif.parentNode.removeChild(notif);
                }
            }, 6500);
        }
    },

    i18n: {
        'English': {
            menu_search: 'Search', menu_home: 'Home', menu_follow: 'Followed', menu_settings: 'Settings', menu_profile: 'Profile',
            tab_appearance: 'Appearance', tab_system: 'System',
            setting_bar_pos: 'Center Bar', setting_theme: 'Dark Theme', setting_notifications: 'Notifications',
            setting_perf: 'Performance Mode', setting_adblock: 'Ad Block (Proxy)', setting_lang: 'Language',
            setting_status: 'Twitch Status', setting_remove: 'Remove Account from List',
            setting_avatars: 'Profile in Followed',
            status_ok: 'All Systems Operational',
            accounts_title: 'Accounts', add_account: 'Add Account',
            viewers: 'viewers', followers: 'followers', streams: 'Streams', clips: 'Clips', videos: 'Videos',
            videos_live: 'Videos & Live',
            days_7: '7 Days', days_30: '30 Days',
            no_live: 'No followed channels are live right now.',
            exit_title: 'Exit Application?', exit_cancel: 'Cancel', exit_confirm: 'Exit',
            loading: 'Loading...', loading_error: 'Loading error.',
            live_recom: 'Recommended Live Channels', top_cats: 'Top Categories',
            live_badge: 'LIVE', followed_channels: 'Followed Channels',
            search_placeholder: 'Search channels or categories...',
            search_live: 'Live Channels', search_cats: 'Categories',
            search_no_results: 'No results found.',
            all_langs: 'All Languages', lang_en_only: 'English Only', lang_it: 'Italian',
            lang_fr: 'French', lang_es: 'Spanish', lang_zh: 'Chinese',
            login_instructions: 'Please follow the instructions on screen',
            login_goto: 'Go to:', login_code_expire: 'The code will expire in', login_minutes: 'minutes.'
        },
        'Italiano': {
            menu_search: 'Cerca', menu_home: 'Home', menu_follow: 'Seguiti', menu_settings: 'Impostazioni', menu_profile: 'Profilo',
            tab_appearance: 'Aspetto', tab_system: 'Sistema',
            setting_bar_pos: 'Barra al Centro', setting_theme: 'Tema Scuro', setting_notifications: 'Notifiche',
            setting_perf: 'Modalità Performance', setting_adblock: 'Blocco Pubblicità', setting_lang: 'Lingua',
            setting_status: 'Stato di Twitch', setting_remove: 'Rimuovi Account',
            setting_avatars: 'Avatar nei Seguiti',
            status_ok: 'Tutti i sistemi sono operativi',
            accounts_title: 'Account', add_account: 'Aggiungi Account',
            viewers: 'spettatori', followers: 'follower', streams: 'Stream', clips: 'Clip', videos: 'Video',
            videos_live: 'Video e Diretta',
            days_7: '7 Giorni', days_30: '30 Giorni',
            no_live: 'Nessun canale seguito è in live.',
            exit_title: 'Vuoi uscire?', exit_cancel: 'Annulla', exit_confirm: 'Esci',
            loading: 'Caricamento...', loading_error: 'Errore di caricamento.',
            live_recom: 'Canali Live Consigliati', top_cats: 'Categorie Popolari',
            live_badge: 'LIVE', followed_channels: 'Canali Seguiti',
            search_placeholder: 'Cerca canali o categorie...',
            search_live: 'Canali Live', search_cats: 'Categorie',
            search_no_results: 'Nessun risultato trovato.',
            all_langs: 'Tutte le lingue', lang_en_only: 'Solo Inglese', lang_it: 'Italiano',
            lang_fr: 'Francese', lang_es: 'Spagnolo', lang_zh: 'Cinese',
            login_instructions: 'Segui le istruzioni sullo schermo',
            login_goto: 'Vai su:', login_code_expire: 'Il codice scadrà in', login_minutes: 'minuti.'
        }
    },

    t: function (key) {
        var lang = App.settings.language || 'English';
        if (!App.i18n[lang]) lang = 'English';
        return App.i18n[lang][key] || key;
    },

    loader: {
        load: function (moduleName) {
            return new Promise(function (resolve) {
                if (App.modules[moduleName]) return resolve();
                var script = document.createElement('script');
                script.src = "js/modules/" + moduleName + ".js";
                script.onload = function() { resolve(); };
                document.body.appendChild(script);
            });
        },
        unload: function (moduleName) {
            if (App.modules[moduleName] && App.modules[moduleName].destroy) {
                App.modules[moduleName].destroy();
            }
        }
    },

    nav: {
        focusIndex: 1, 
        inMenu: true,
        menuMap: ['search', 'home', 'follow', 'settings', 'profile'],

        update: function () {
            var menuItems = document.querySelectorAll('.menu-item');
            var indicator = document.getElementById('nav-indicator');
            var active = menuItems[App.nav.focusIndex];
            var searchDropdown = document.getElementById('search-dropdown');
            var searchInput = document.getElementById('search-input');

            if (indicator && active) {
                indicator.style.opacity = App.nav.inMenu ? "1" : "0.3";
                indicator.style.width = active.offsetWidth + 'px';
                indicator.style.left = active.offsetLeft + 'px';
            }

            for (var i = 0; i < menuItems.length; i++) {
                var m = menuItems[i];
                m.classList.toggle('active-text', i === App.nav.focusIndex);
                if (m.id === 'menu-home') m.innerText = App.t('menu_home');
                if (m.id === 'menu-follow') m.innerText = App.t('menu_follow');
                if (m.id === 'menu-settings') m.innerText = App.t('menu_settings');
            }

            var topbar = document.getElementById('topbar');
            if (topbar) {
                if (!App.nav.inMenu) {
                    topbar.classList.add('hidden-topbar');
                    document.body.classList.add('menu-hidden');
                } else {
                    topbar.classList.remove('hidden-topbar');
                    document.body.classList.remove('menu-hidden');
                }
            }

            if (searchDropdown && searchInput) {
                searchInput.placeholder = App.t('search_placeholder');
                var isOnLens = App.nav.focusIndex === 0 && App.nav.inMenu;
                if (App.nav.focusIndex === 0 || isOnLens) {
                    searchDropdown.classList.add('search-open');
                } else {
                    searchDropdown.classList.remove('search-open');
                    searchInput.classList.remove('search-focused');
                    searchInput.blur();
                }
            }
        },

        navigateTo: function (moduleName) {
            var isRestore = App.modules[moduleName] !== undefined; 

            if (App.currentModule && App.currentModule !== moduleName) {
                App.previousModule = App.currentModule;
                App.loader.unload(App.currentModule);
            }

            App.currentModule = moduleName;
            return App.loader.load(moduleName).then(function() {
                if (!isRestore && App.modules[moduleName] && App.modules[moduleName].init) {
                    App.modules[moduleName].init(); 
                }
                if (App.modules[moduleName] && App.modules[moduleName].load) {
                    return App.modules[moduleName].load(isRestore); 
                }
            });
        }
    },

    api: {
        twitchFetch: function (url, options, ttlSeconds) {
            if (!options) options = {};
            if (ttlSeconds > 0) {
                var cached = App.apiCache[url];
                if (cached && (Date.now() - cached.timestamp < ttlSeconds * 1000)) {
                    return Promise.resolve(cached.data);
                }
            }

            if (!options.headers) options.headers = {};
            options.headers['Client-ID'] = window.CLIENT_ID;
            options.headers['Authorization'] = 'Bearer ' + App.auth.token;

            return fetch(url, options).then(function(res) {
                if (res.status === 401 && App.auth.refresh) {
                    return App.authManager.refreshToken().then(function() {
                        options.headers['Authorization'] = 'Bearer ' + App.auth.token;
                        return fetch(url, options);
                    });
                }
                return res;
            }).then(function(res) {
                return res.json();
            }).then(function(data) {
                if (ttlSeconds > 0) {
                    App.apiCache[url] = { timestamp: Date.now(), data: data };
                }
                return data;
            });
        }
    },

    authManager: {
        loadProfiles: function () {
            App.profiles = JSON.parse(localStorage.getItem('twitch_profiles')) || [];
            App.activeProfileId = localStorage.getItem('active_profile_id') || '';
            var activeId = App.activeProfileId;
            var profile = App.profiles.filter(function(p) { return p.id === activeId; })[0] || App.profiles[0];

            if (profile) {
                App.auth.token = profile.token;
                App.auth.refresh = profile.refresh;
                App.auth.userId = profile.id;
                App.activeProfileId = profile.id;
                localStorage.setItem('active_profile_id', App.activeProfileId);
            } else {
                App.auth = { token: '', refresh: '', userId: '' };
                App.activeProfileId = '';
            }
        },
        refreshToken: function () {
            if (!App.auth.refresh) {
                return App.authManager.logout();
            }
            return fetch('https://id.twitch.tv/oauth2/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'client_id=' + window.CLIENT_ID + '&grant_type=refresh_token&refresh_token=' + App.auth.refresh
            }).then(function(res) {
                return res.json();
            }).then(function(data) {
                if (data.access_token) {
                    App.auth.token = data.access_token;
                    App.auth.refresh = data.refresh_token || App.auth.refresh;

                    if (App.activeProfileId) {
                        var profIndex = -1;
                        for (var i = 0; i < App.profiles.length; i++) {
                            if (App.profiles[i].id === App.activeProfileId) {
                                profIndex = i;
                                break;
                            }
                        }
                        if (profIndex !== -1) {
                            App.profiles[profIndex].token = App.auth.token;
                            App.profiles[profIndex].refresh = App.auth.refresh;
                            localStorage.setItem('twitch_profiles', JSON.stringify(App.profiles));
                        }
                    }
                } else {
                    return App.authManager.logout();
                }
            }).catch(function() {
                return App.authManager.logout();
            });
        },
        logout: function () {
            if (App.activeProfileId) {
                App.profiles = App.profiles.filter(function(p) { return p.id !== App.activeProfileId; });
                localStorage.setItem('twitch_profiles', JSON.stringify(App.profiles));

                if (App.profiles.length > 0) {
                    App.activeProfileId = App.profiles[0].id;
                    localStorage.setItem('active_profile_id', App.activeProfileId);
                } else {
                    App.activeProfileId = '';
                }
            }
            App.authManager.loadProfiles();
            App.nav.focusIndex = 4; 
            App.nav.inMenu = false;
            App.nav.update();
            return App.nav.navigateTo('profile');
        }
    },

    utils: {
        getThumbSize: function (type) {
            if (App.settings.performanceMode) {
                if (type === 'stream') return { w: 400, h: 225 };
                if (type === 'category') return { w: 150, h: 200 };
            }
            if (type === 'stream') return { w: 600, h: 338 };
            if (type === 'category') return { w: 300, h: 400 };
            return { w: 600, h: 338 };
        },
        getSafeThumb: function (url, type) {
            if (!url) return 'icon.png';
            var size = this.getThumbSize(type);
            return url.replace('{width}', size.w).replace('{height}', size.h)
                      .replace('%{width}', size.w).replace('%{height}', size.h);
        },
        formatViewers: function (count) {
            if (!count) return '0';
            if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
            if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
            return count.toString();
        },
        applySettings: function () {
            var topbarMenu = document.getElementById('main-menu');
            if (topbarMenu) {
                if (App.settings.barPos === 'center') {
                    topbarMenu.style.justifyContent = 'center';
                    topbarMenu.style.paddingLeft = '0px';
                } else {
                    topbarMenu.style.justifyContent = 'flex-start';
                    topbarMenu.style.paddingLeft = '80px';
                }
            }
            if (App.settings.theme === 'light') document.body.classList.add('theme-light');
            else document.body.classList.remove('theme-light');

            if (App.settings.performanceMode) document.body.classList.add('perf-mode');
            else document.body.classList.remove('perf-mode');
        },
        saveSettings: function () {
            localStorage.setItem('twitch_settings', JSON.stringify(App.settings));
            App.utils.applySettings();
        },
        scrollToElement: function (el) {
            if (!el) return;
            var rect = el.getBoundingClientRect();
            var absoluteElementTop = rect.top + window.pageYOffset;
            var offset = 280; 
            var scrollPos = absoluteElementTop - offset;
            if (scrollPos < 0) scrollPos = 0;
            window.scrollTo(0, scrollPos);
        }
    },

    init: function () {
        var storedSettings = JSON.parse(localStorage.getItem('twitch_settings'));
        if (storedSettings) {
            for (var key in storedSettings) {
                App.settings[key] = storedSettings[key];
            }
        }
        App.utils.applySettings();

        App.authManager.loadProfiles();

        var promise = Promise.resolve();
        if (App.auth.token) {
            promise = fetch('https://id.twitch.tv/oauth2/validate', {
                headers: { 'Authorization': 'OAuth ' + App.auth.token }
            }).then(function(response) {
                if (response.status === 401) {
                    return App.authManager.refreshToken();
                } else {
                    return response.json().then(function(data) {
                        App.auth.userId = data.user_id;
                    });
                }
            }).then(function() {
                App.notifications.init();
            }).catch(function(error) { console.error("Validation error:", error); });
        }

        return promise.then(function() {
            var splash = document.getElementById('splash-screen');
            if (splash) splash.classList.add('hidden');

            App.isStartupProfileSelect = true; 
            App.nav.focusIndex = 4; 
            App.nav.inMenu = false; 

            App.nav.update();
            var startModule = App.nav.menuMap[App.nav.focusIndex];
            return App.nav.navigateTo(startModule);
        }).then(function() {
            document.addEventListener('keydown', App.handleGlobalKey);
        });
    },

    handleGlobalKey: function (e) {
        if (App.ExitMenu && App.ExitMenu.active) {
            App.ExitMenu.handleKey(e);
            return;
        }

        if (App.nav.inMenu && App.currentModule !== 'player') {
            var maxIdx = App.nav.menuMap.length - 1;

            if (!App.auth.token && App.nav.focusIndex !== 4) {
                App.nav.focusIndex = 4;
                App.nav.update();
            }

            if (e.keyCode === 39 && App.nav.focusIndex < maxIdx) {
                App.nav.focusIndex++; 
                App.nav.update(); 
                App.nav.navigateTo(App.nav.menuMap[App.nav.focusIndex]);
                return;
            }
            if (e.keyCode === 37 && App.nav.focusIndex > 0) {
                App.nav.focusIndex--; 
                App.nav.update(); 
                App.nav.navigateTo(App.nav.menuMap[App.nav.focusIndex]);
                return;
            }
            if (e.keyCode === 40) {
                App.nav.inMenu = false;
                App.nav.update();

                if (App.modules[App.currentModule] && App.modules[App.currentModule].onMenuExit) {
                    App.modules[App.currentModule].onMenuExit(e);
                }
                return;
            }
            if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
                if (App.ExitMenu) {
                    App.ExitMenu.show();
                }
                return;
            }
        }

        if (App.modules[App.currentModule] && App.modules[App.currentModule].handleKey) {
            App.modules[App.currentModule].handleKey(e);
        }
    }
};

window.onload = function() { App.init(); };