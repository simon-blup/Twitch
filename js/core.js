window.CLIENT_ID = '9g8h4ha9stbc9r76624evvlx4bzk39';

window.App = {
    modules: {},
    currentModule: null,
    previousModule: null,
    stateCache: {}, // RAM Cache for restoring views
    apiCache: {}, // RAM Cache for API responses
    
    settings: {
        barPos: 'center', theme: 'dark', performanceMode: false, 
        notifications: true, adBlock: true, language: 'English', 
        showFollowedAvatars: true
    },
    
    profiles: [],
    activeProfileId: '',
    auth: { token: '', refresh: '', userId: '' },
    
    i18n: {
        'English': {
            menu_search: 'Search', menu_home: 'Home', menu_follow: 'Followed', menu_settings: 'Settings', menu_profile: 'Profile',
            tab_appearance: 'Appearance', tab_system: 'System',
            setting_bar_pos: 'Bar Position', setting_theme: 'Dark Theme', setting_notifications: 'Notifications',
            setting_perf: 'Performance Mode', setting_adblock: 'Ad Block (Proxy)', setting_lang: 'Language',
            setting_status: 'Twitch Status', setting_remove: 'Remove Account from List',
            status_ok: 'All Systems Operational',
            accounts_title: 'Accounts', add_account: 'Add Account',
            viewers: 'viewers', followers: 'followers', streams: 'Streams', clips: 'Clips',
            days_7: '7 Days', days_30: '30 Days',
            no_live: 'No followed channels are live right now.',
            exit_title: 'Exit Application?', exit_cancel: 'Cancel', exit_confirm: 'Exit',
            search_placeholder: 'Search channels or categories...',
            search_live: 'Live Channels', search_categories: 'Categories',
            feat_content: 'Featured Content', top_cats: 'Top Categories', live_recom: 'Followed Channels',
            followed_channels: 'Followed Channels', center: 'Center', left: 'Left',
            loading: 'Loading...', live_badge: 'LIVE', loading_error: 'Loading error.',
            channels: 'Channels', clips: 'Clips',
            days_7: '7 Days', days_30: '30 Days',
            lang_en_only: 'EN', lang_it: 'IT', lang_fr: 'FR', lang_es: 'ES', lang_zh: 'ZH',
            login_request: 'Requesting code...',

            setting_avatars_desc: 'Shows live streamer icons in the followed section. May increase loading time.'
        },
        'Italiano': {
            menu_search: 'Cerca', menu_home: 'Home', menu_follow: 'Seguiti', menu_settings: 'Impostazioni', menu_profile: 'Profilo',
            tab_appearance: 'Aspetto', tab_system: 'Sistema',
            setting_bar_pos: 'Posizione Barra', setting_theme: 'Tema Scuro', setting_notifications: 'Notifiche',
            setting_perf: 'Modalità Performance', setting_adblock: 'Blocco Pubblicità', setting_lang: 'Lingua',
            setting_status: 'Stato Twitch', setting_remove: 'Rimuovi Account dalla Lista',
            status_ok: 'Tutti i sistemi operativi',
            accounts_title: 'Account', add_account: 'Aggiungi Account',
            viewers: 'spettatori', followers: 'follower', streams: 'Stream', clips: 'Clip',
            days_7: '7 Giorni', days_30: '30 Giorni',
            no_live: 'Nessun canale seguito è live al momento.',
            exit_title: 'Vuoi uscire dall\'applicazione?', exit_cancel: 'Annulla', exit_confirm: 'Esci',
            search_placeholder: 'Cerca canali o categorie...',
            search_live: 'Canali Live', search_categories: 'Categorie',
            feat_content: 'Contenuti in primo piano', top_cats: 'Categorie Popolari', live_recom: 'Canali Seguiti',
            followed_channels: 'Canali Seguiti', center: 'Centro', left: 'Sinistra',
            loading: 'Caricamento...', live_badge: 'LIVE', loading_error: 'Errore di caricamento.',
            channels: 'Canali',
            setting_avatars: 'Mostra Avatar Seguiti',
            setting_avatars_desc: 'Mostra le icone dei canali live seguiti. Potrebbe allungare il caricamento.'
        },
        'Español': {
            menu_search: 'Buscar', menu_home: 'Inicio', menu_follow: 'Seguidos', menu_settings: 'Ajustes', menu_profile: 'Perfil',
            tab_appearance: 'Apariencia', tab_system: 'Sistema',
            setting_bar_pos: 'Posición de barra', setting_theme: 'Tema oscuro', setting_notifications: 'Notificaciones',
            setting_perf: 'Modo rendimiento', setting_adblock: 'Bloqueo de anuncios', setting_lang: 'Idioma',
            setting_status: 'Estado de Twitch', setting_remove: 'Eliminar cuenta de la lista',
            status_ok: 'Todos los sistemas operativos',
            accounts_title: 'Cuentas', add_account: 'Añadir cuenta',
            viewers: 'espectadores', followers: 'seguidores', streams: 'Streams', clips: 'Clips',
            days_7: '7 Días', days_30: '30 Días',
            no_live: 'No hay canales seguidos en vivo ahora mismo.',
            exit_title: '¿Salir de la aplicación?', exit_cancel: 'Cancelar', exit_confirm: 'Salir',
            search_placeholder: 'Buscar canales o categorías...',
            search_live: 'Canales en vivo', search_categories: 'Categorías',
            feat_content: 'Contenido destacado', top_cats: 'Categorías principales', live_recom: 'Canales Seguidos',
            followed_channels: 'Canales Seguidos', center: 'Centro', left: 'Izquierda',
            loading: 'Cargando...', live_badge: 'VIVO', loading_error: 'Error de carga.',
            channels: 'Canales',
            setting_avatars: 'Mostrar avatares seguidos',
            setting_avatars_desc: 'Muestra iconos de streamers en vivo. Puede aumentar el tiempo de carga.'
        },
        '中文': {
            menu_search: '搜索', menu_home: '首页', menu_follow: '已关注', menu_settings: '设置', menu_profile: '个人资料',
            tab_appearance: '外观', tab_system: '系统',
            setting_bar_pos: '栏位置', setting_theme: '深色主题', setting_notifications: '通知',
            setting_perf: '性能模式', setting_adblock: '广告拦截', setting_lang: '语言',
            setting_status: 'Twitch 状态', setting_remove: '从列表中删除账户',
            status_ok: '所有系统运行正常',
            accounts_title: '账户', add_account: '添加账户',
            viewers: '观众', followers: '粉丝', streams: '直播', clips: '剪辑',
            days_7: '7 天', days_30: '30 天',
            no_live: '目前没有关注的频道在直播。',
            exit_title: '退出应用？', exit_cancel: '取消', exit_confirm: '退出',
            search_placeholder: '搜索频道或类别...',
            search_live: '正在直播', search_categories: '类别',
            feat_content: '精选内容', top_cats: '热门类别', live_recom: '已关注的频道',
            followed_channels: '已关注的频道', center: '居中', left: '居左',
            loading: '加载中...', live_badge: '直播', loading_error: '加载错误。',
            channels: '频道',
            login_request: '正在请求代码...',
            login_error: '登录错误',
            login_network_error: '网络错误',
            login_expired: '登录已过期',
            setting_avatars: '显示关注的头像',
            setting_avatars_desc: '显示关注的直播主图标。可能会增加加载时间。'
        },
        'Français': {
            menu_search: 'Rechercher', menu_home: 'Accueil', menu_follow: 'Suivis', menu_settings: 'Paramètres', menu_profile: 'Profil',
            tab_appearance: 'Apparence', tab_system: 'Système',
            setting_bar_pos: 'Position de la barre', setting_theme: 'Thème sombre', setting_notifications: 'Notifications',
            setting_perf: 'Mode performance', setting_adblock: 'Bloqueur de pub', setting_lang: 'Langue',
            setting_status: 'État de Twitch', setting_remove: 'Supprimer le compte de la liste',
            status_ok: 'Tous les systèmes sont opérationnels',
            accounts_title: 'Comptes', add_account: 'ajouter un compte',
            viewers: 'spectateurs', followers: 'abonnés', streams: 'Streams', clips: 'Clips',
            days_7: '7 Jours', days_30: '30 Jours',
            no_live: 'Aucune chaîne suivie n\'est en direct pour le moment.',
            exit_title: 'Quitter l\'application ?', exit_cancel: 'Annuler', exit_confirm: 'Quitter',
            search_placeholder: 'Rechercher des chaînes ou catégories...',
            search_live: 'Chaînes en direct', search_categories: 'Catégories',
            feat_content: 'Contenido vedette', top_cats: 'Meilleures catégories', live_recom: 'Chaînes Suivies',
            followed_channels: 'Chaînes Suivies', center: 'Centre', left: 'Gauche',
            loading: 'Chargement...', live_badge: 'DIRECT', loading_error: 'Erreur de chargement.',
            channels: 'Chaînes',
            setting_avatars: 'Afficher les avatars suivis',
            setting_avatars_desc: 'Affiche les icônes des streamers suivis. Peut augmenter le temps de chargement.'
        }
    },
    
    t: function(key) {
        const lang = App.settings.language || 'English';
        return App.i18n[lang][key] || App.i18n['English'][key] || key;
    },

    loader: {
        load: function(moduleName) {
            return new Promise((resolve, reject) => {
                if (App.modules[moduleName]) return resolve();
                const script = document.createElement('script');
                script.src = `js/modules/${moduleName}.js`;
                script.id = `module-script-${moduleName}`;
                script.onload = resolve;
                script.onerror = reject;
                document.body.appendChild(script);
            });
        },
        unload: function(moduleName) {
            if (App.modules[moduleName]) {
                if (App.modules[moduleName].destroy) {
                    App.modules[moduleName].destroy(); // Moduli devono solo fare innerHTML = ''
                }
                // Ottimizzazione Estrema: NON cancelliamo il modulo dalla RAM
                // delete App.modules[moduleName];
                // const script = document.getElementById(`module-script-${moduleName}`);
                // if (script) script.remove();
            }
        }
    },

    nav: {
        focusIndex: 1, // 0: Search, 1: Home, 2: Follow, 3: Settings, 4: Profile
        inMenu: true,
        menuMap: ['search', 'home', 'follow', 'settings', 'profile'],
        
        update: function() {
            const menuItems = document.querySelectorAll('.menu-item');
            const indicator = document.getElementById('nav-indicator');
            const active = menuItems[App.nav.focusIndex];
            const searchDropdown = document.getElementById('search-dropdown');
            const searchInput = document.getElementById('search-input');

            if (indicator && active) {
                indicator.style.opacity = App.nav.inMenu ? "1" : "0.3";
                indicator.style.width = active.offsetWidth + 'px';
                indicator.style.left = active.offsetLeft + 'px';
            }
            
            menuItems.forEach((m, i) => {
                m.classList.toggle('active-text', i === App.nav.focusIndex);
                if (m.id === 'menu-home') m.innerText = App.t('menu_home');
                if (m.id === 'menu-follow') m.innerText = App.t('menu_follow');
                if (m.id === 'menu-settings') m.innerText = App.t('menu_settings');
            });

            const topbar = document.getElementById('topbar');
            if (topbar) {
                if (!App.nav.inMenu && App.nav.focusIndex !== 0) { 
                    topbar.classList.add('hidden-topbar');
                    document.body.classList.add('menu-hidden');
                } else {
                    topbar.classList.remove('hidden-topbar');
                    document.body.classList.remove('menu-hidden');
                }
            }
            
            if (searchDropdown && searchInput) {
                searchInput.placeholder = App.t('search_placeholder');
                const isOnLens = App.nav.focusIndex === 0 && App.nav.inMenu;
                if (App.nav.focusIndex === 0 || isOnLens) {
                    searchDropdown.classList.add('search-open');
                } else {
                    searchDropdown.classList.remove('search-open');
                    searchInput.classList.remove('search-focused');
                    searchInput.blur();
                }
            }
        },
        
        navigateTo: async function(moduleName) {
            const isRestore = App.modules[moduleName] !== undefined; // Se è già in RAM, è un restore
            
            if (App.currentModule && App.currentModule !== moduleName) {
                App.previousModule = App.currentModule;
                App.loader.unload(App.currentModule);
            }
            
            App.currentModule = moduleName;
            await App.loader.load(moduleName);
            
            if (!isRestore && App.modules[moduleName] && App.modules[moduleName].init) {
                App.modules[moduleName].init(); // Solo alla prima creazione
            }
            if (App.modules[moduleName] && App.modules[moduleName].load) {
                await App.modules[moduleName].load(isRestore); // Passiamo il flag isRestore
            }
        }
    },

    api: {
        twitchFetch: async function(url, options = {}, ttlSeconds = 0) {
            if (ttlSeconds > 0) {
                const cached = App.apiCache[url];
                if (cached && (Date.now() - cached.timestamp < ttlSeconds * 1000)) {
                    return cached.data;
                }
            }

            if (!options.headers) options.headers = {};
            options.headers['Client-ID'] = window.CLIENT_ID;
            options.headers['Authorization'] = 'Bearer ' + App.auth.token;

            let res = await fetch(url, options);
            if (res.status === 401 && App.auth.refresh) {
                await App.authManager.refreshToken();
                options.headers['Authorization'] = 'Bearer ' + App.auth.token;
                res = await fetch(url, options);
            }
            const data = await res.json();
            
            if (ttlSeconds > 0) {
                App.apiCache[url] = { timestamp: Date.now(), data: data };
            }
            return data;
        }
    },

    authManager: {
        loadProfiles: function() {
            App.profiles = JSON.parse(localStorage.getItem('twitch_profiles')) || [];
            App.activeProfileId = localStorage.getItem('active_profile_id') || '';
            const profile = App.profiles.find(p => p.id === App.activeProfileId) || App.profiles[0];
            
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
        refreshToken: async function() {
            if (!App.auth.refresh) {
                await App.authManager.logout();
                return;
            }
            try {
                const response = await fetch('https://id.twitch.tv/oauth2/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `client_id=${window.CLIENT_ID}&grant_type=refresh_token&refresh_token=${App.auth.refresh}`
                });
                const data = await response.json();
                if (data.access_token) {
                    App.auth.token = data.access_token;
                    App.auth.refresh = data.refresh_token || App.auth.refresh;
                    
                    if (App.activeProfileId) {
                        const profIndex = App.profiles.findIndex(p => p.id === App.activeProfileId);
                        if (profIndex !== -1) {
                            App.profiles[profIndex].token = App.auth.token;
                            App.profiles[profIndex].refresh = App.auth.refresh;
                            localStorage.setItem('twitch_profiles', JSON.stringify(App.profiles));
                        }
                    }
                } else {
                    await App.authManager.logout();
                }
            } catch (error) {
                await App.authManager.logout();
            }
        },
        logout: async function() {
            if (App.activeProfileId) {
                App.profiles = App.profiles.filter(p => p.id !== App.activeProfileId);
                localStorage.setItem('twitch_profiles', JSON.stringify(App.profiles));
                
                if (App.profiles.length > 0) {
                    App.activeProfileId = App.profiles[0].id;
                    localStorage.setItem('active_profile_id', App.activeProfileId);
                } else {
                    App.activeProfileId = '';
                }
            }
            App.authManager.loadProfiles();
            App.nav.focusIndex = 4; // profile
            App.nav.inMenu = false;
            App.nav.update();
            await App.nav.navigateTo('profile');
        }
    },

    utils: {
        getThumbSize: function(type) {
            if (App.settings.performanceMode) {
                if (type === 'stream') return { w: 400, h: 225 };
                if (type === 'category') return { w: 150, h: 200 };
                if (type === 'avatar') return { w: 70, h: 70 };
            }
            if (type === 'stream') return { w: 800, h: 450 };
            if (type === 'category') return { w: 300, h: 400 };
            if (type === 'avatar') return { w: 300, h: 300 };
            return { w: 600, h: 338 }; 
        },
        getSafeThumb: function(url, type) {
            if (!url) return 'icon.png';
            const size = App.utils.getThumbSize(type);
            return url.replace(/-[0-9]+x[0-9]+\./, `-${size.w}x${size.h}.`)
                      .replace('{width}', size.w).replace('{height}', size.h)
                      .replace('%{width}', size.w).replace('%{height}', size.h);
        },
        formatViewers: function(count) {
            if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
            else if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
            return count.toString();
        },
        applySettings: function() {
            const topbarMenu = document.getElementById('main-menu');
            if(topbarMenu) {
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
        saveSettings: function() {
            localStorage.setItem('twitch_settings', JSON.stringify(App.settings));
            App.utils.applySettings();
        }
    },

    init: async function() {
        // Load Settings
        const storedSettings = JSON.parse(localStorage.getItem('twitch_settings'));
        if (storedSettings) Object.assign(App.settings, storedSettings);
        App.utils.applySettings();

        // Load Auth
        App.authManager.loadProfiles();

        // Check Login Status
        if (App.auth.token) {
            try {
                const response = await fetch('https://id.twitch.tv/oauth2/validate', {
                    headers: { 'Authorization': 'OAuth ' + App.auth.token }
                });
                if (response.status === 401) {
                    await App.authManager.refreshToken();
                } else {
                    const data = await response.json();
                    App.auth.userId = data.user_id;
                }
            } catch (error) { console.error("Validation error:", error); }
        }

        const splash = document.getElementById('splash-screen');
        if (splash) splash.classList.add('hidden');

        // Initial Route
        if (!App.auth.token) {
            App.nav.focusIndex = 4; // profile
            App.nav.inMenu = false;
        }
        
        App.nav.update();
        const startModule = App.nav.menuMap[App.nav.focusIndex];
        await App.nav.navigateTo(startModule);

        // Global Key Handler
        document.addEventListener('keydown', App.handleGlobalKey);
    },

    handleGlobalKey: function(e) {
        // Intercept Top Menu navigation if inMenu is true
        if (App.nav.inMenu && App.currentModule !== 'player') {
            const maxIdx = App.nav.menuMap.length - 1;
            
            // Mandatory Login Lock
            if (!App.auth.token && App.nav.focusIndex !== 4) {
                App.nav.focusIndex = 4;
                App.nav.update();
            }

            if (e.keyCode === 39 && App.nav.focusIndex < maxIdx) { 
                App.nav.focusIndex++; App.nav.update(); App.nav.navigateTo(App.nav.menuMap[App.nav.focusIndex]); 
                return;
            }
            if (e.keyCode === 37 && App.nav.focusIndex > 0) { 
                App.nav.focusIndex--; App.nav.update(); App.nav.navigateTo(App.nav.menuMap[App.nav.focusIndex]); 
                return;
            }
            if (e.keyCode === 40) { 
                App.nav.inMenu = false; 
                App.nav.update(); 
                
                // allow module to handle the transition if needed
                if (App.modules[App.currentModule] && App.modules[App.currentModule].onMenuExit) {
                    App.modules[App.currentModule].onMenuExit(e);
                }
                return;
            }
        }
        
        // Delegate to current module
        if (App.modules[App.currentModule] && App.modules[App.currentModule].handleKey) {
            App.modules[App.currentModule].handleKey(e);
        }
    }
};

window.onload = () => App.init();init();p.init();