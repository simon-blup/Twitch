(function () {
    let state = {
        isPolling: false,
        pollInterval: null,
        deviceCode: '',
        userCode: '',
        statusMsg: '',
        activeRow: 0 // 0: accounts list, length: add account
    };

    App.modules.profile = {
        init: function () {
            state.isPolling = false;
            clearInterval(state.pollInterval);
            state.deviceCode = '';
            state.userCode = '';
            state.statusMsg = '';
            state.activeRow = 0;
        },

        load: async function () {
            if (App.auth.token) {
                this.renderAuthenticated();
            } else {
                this.startDeviceFlow();
            }
        },

        startDeviceFlow: async function () {
            this.renderUnauthenticated(App.t('login_request').toUpperCase());
            try {
                const res = await fetch('https://id.twitch.tv/oauth2/device', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `client_id=${window.CLIENT_ID}&scopes=user:read:follows`
                });
                const data = await res.json();

                if (data.device_code) {
                    state.deviceCode = data.device_code;
                    state.userCode = data.user_code;
                    this.renderUnauthenticated();
                    this.pollForToken(data.interval);
                } else {
                    this.renderUnauthenticated(App.t('login_error').toUpperCase());
                }
            } catch (e) {
                this.renderUnauthenticated(App.t('login_network_error').toUpperCase());
            }
        },

        pollForToken: function (interval) {
            state.isPolling = true;
            state.pollInterval = setInterval(async () => {
                if (!state.isPolling) return;
                try {
                    const res = await fetch('https://id.twitch.tv/oauth2/token', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: `client_id=${window.CLIENT_ID}&scopes=user:read:follows&device_code=${state.deviceCode}&grant_type=urn:ietf:params:oauth:grant-type:device_code`
                    });
                    const data = await res.json();

                    if (data.access_token) {
                        clearInterval(state.pollInterval);
                        state.isPolling = false;

                        const valRes = await fetch('https://id.twitch.tv/oauth2/validate', {
                            headers: { 'Authorization': 'OAuth ' + data.access_token }
                        });
                        const valData = await valRes.json();

                        const newProfile = {
                            id: valData.user_id,
                            login: valData.login,
                            token: data.access_token,
                            refresh: data.refresh_token
                        };

                        App.profiles = App.profiles.filter(p => p.id !== newProfile.id);
                        App.profiles.push(newProfile);
                        App.activeProfileId = newProfile.id;
                        localStorage.setItem('twitch_profiles', JSON.stringify(App.profiles));
                        localStorage.setItem('active_profile_id', App.activeProfileId);

                        App.authManager.loadProfiles();

                        // Navigazione in Home con MENU ATTIVO
                        App.nav.focusIndex = 1; // Home
                        App.nav.inMenu = true;
                        App.nav.update();
                        App.nav.navigateTo('home');
                    } else if (data.message !== 'authorization_pending') {
                        clearInterval(state.pollInterval);
                        state.isPolling = false;
                        this.renderUnauthenticated(App.t('login_expired').toUpperCase());
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, interval * 1000);
        },

        renderUnauthenticated: function (msg) {
            const viewArea = document.getElementById('main-view-area');
            if (!viewArea) return;

            let html = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; width:100vw; position:fixed; top:0; left:0; background:#0e0e10; color:white; text-align:center; z-index:1000;">
                    <!-- Logo in alto adattivo -->
                    <img src="icon.png" style="width:100px; position:absolute; top:${App.nav.inMenu ? '140px' : '60px'}; transition: 0.3s;">
                    
                    ${state.userCode ? `
                        <div style="position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center; margin-top:${App.nav.inMenu ? '80px' : '0px'}; transition: 0.3s;">
                            <div style="position:absolute; left:25%; transform:translateX(-50%); background:white; padding:15px; border-radius:15px; box-shadow: 0 0 30px rgba(145, 70, 255, 0.3);">
                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent('https://www.twitch.tv/activate?device-code=' + state.userCode)}" style="width:180px; height:180px; display:block;">
                            </div>
                            <div style="background:#18181b; padding:40px 60px; border-radius:30px; border:4px solid #bf94ff; box-shadow: 0 0 50px rgba(145, 70, 255, 0.2);">
                                <div style="font-size:80px; font-weight:bold; letter-spacing:12px; margin-bottom:15px;">${state.userCode}</div>
                                <div style="font-size:32px; color:#bf94ff; font-weight:bold; letter-spacing:2px;">twitch.tv/activate</div>
                            </div>
                        </div>
                    ` : `
                        <div style="display:flex; align-items:center; justify-content:center; height:100%;">
                            <div style="font-size:28px; color:#adadb8; font-weight:300; letter-spacing:2px;">${msg || App.t('loading').toUpperCase()}</div>
                        </div>
                    `}
                </div>
            `;
            viewArea.innerHTML = html;
        },

        renderAuthenticated: async function () {
            const viewArea = document.getElementById('main-view-area');
            if (!viewArea) return;

            // Usa la cache se disponibile per un rendering istantaneo
            const cacheKey = 'profiles_data';
            const cachedProfiles = App.stateCache[cacheKey];

            if (cachedProfiles) {
                // Rendering immediato dalla RAM per eliminare il loading
                this.drawProfiles(viewArea, cachedProfiles);
                // Aggiornamento silenzioso in background senza mostrare caricamenti
                this.updateProfilesInBackground(viewArea, cacheKey);
            } else {
                // Prima volta in assoluto: mostriamo il loading al centro
                viewArea.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100vh; width:100vw; font-size:24px; color:#adadb8;">${App.t('loading').toUpperCase()}</div>`;
                const profiles = await this.fetchProfilesData();
                App.stateCache[cacheKey] = profiles;
                this.drawProfiles(viewArea, profiles);
            }
        },

        fetchProfilesData: async function () {
            const profilesWithAvatars = JSON.parse(JSON.stringify(App.profiles));
            try {
                const ids = App.profiles.map(p => p.id).join('&id=');
                if (ids) {
                    const res = await App.api.twitchFetch(`https://api.twitch.tv/helix/users?id=${ids}`);
                    if (res && res.data) {
                        res.data.forEach(userData => {
                            const p = profilesWithAvatars.find(prof => prof.id === userData.id);
                            if (p) p.avatar = userData.profile_image_url;
                        });
                    }
                }
            } catch (e) { console.error("Error fetching avatars", e); }
            return profilesWithAvatars;
        },

        updateProfilesInBackground: async function (viewArea, cacheKey) {
            const freshProfiles = await this.fetchProfilesData();
            // Confronta se ci sono cambiamenti reali prima di ridisegnare per evitare sfarfallio
            if (JSON.stringify(freshProfiles) !== JSON.stringify(App.stateCache[cacheKey])) {
                App.stateCache[cacheKey] = freshProfiles;
                // Ridisegna solo se siamo ancora in questa vista e non nel menu
                if (!App.nav.inMenu) this.drawProfiles(viewArea, freshProfiles);
            }
        },

        drawProfiles: function (viewArea, profiles) {
            // Se il carosello esiste già, aggiorniamo solo le posizioni per permettere la transizione CSS
            const existingTitle = document.getElementById('profile-title');
            const existingCarousel = document.getElementById('profiles-carousel');

            if (existingTitle && existingCarousel) {
                existingTitle.style.top = App.nav.inMenu ? '140px' : '80px';
                existingCarousel.style.marginTop = App.nav.inMenu ? '100px' : '0px';
                this.updateSelection();
                return;
            }

            let html = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; width:100vw; color:white; overflow:hidden; position:fixed; top:0; left:0;">
                    <!-- Titolo adattivo con transizione sincronizzata (0.5s) -->
                    <h2 id="profile-title" style="position:absolute; top:${App.nav.inMenu ? '140px' : '80px'}; font-size:38px; font-weight:bold; letter-spacing:2px; color:#efeff1; transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);">
                        ${App.t('accounts_title').toUpperCase()}
                    </h2>
                    
                    <!-- Carosello centrato con transizione sincronizzata (0.5s) -->
                    <div id="profiles-carousel" style="display:flex; align-items:flex-start; justify-content:center; gap:50px; padding:20px; margin-top:${App.nav.inMenu ? '100px' : '0px'}; transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);">
                        ${profiles.map((p, i) => `
                            <div id="prof-opt-${i}" class="profile-card" style="display:flex; flex-direction:column; align-items:center; width:220px; transition:0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); position:relative;">
                                <div class="avatar-container" style="width:180px; height:180px; border-radius:50%; border:6px solid ${p.id === App.activeProfileId ? '#bf94ff' : 'transparent'}; overflow:hidden; margin-bottom:25px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); transition: 0.3s;">
                                    <img src="${p.avatar || 'icon.png'}" style="width:100%; height:100%; object-fit:cover;">
                                </div>
                                <div style="font-size:26px; font-weight:bold; text-align:center; width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.login}</div>
                                ${p.id === App.activeProfileId ? `<div style="position:absolute; top:-10px; right:20px; background:#bf94ff; color:white; width:35px; height:35px; display:flex; align-items:center; justify-content:center; border-radius:50%; font-size:20px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); border:3px solid #0e0e10;">✔</div>` : ''}
                            </div>
                        `).join('')}
                        
                        <div id="prof-opt-${App.profiles.length}" class="profile-card" style="display:flex; flex-direction:column; align-items:center; width:220px; transition:0.3s;">
                            <div class="avatar-container" style="width:180px; height:180px; border-radius:50%; background:#1f1f23; border:6px dashed #3a3a3d; display:flex; align-items:center; justify-content:center; margin-bottom:25px; transition: 0.3s;">
                                <div style="font-size:80px; color:#adadb8; font-weight:100;">+</div>
                            </div>
                            <div style="font-size:26px; font-weight:bold; color:#adadb8;">${App.t('add_account').toUpperCase()}</div>
                        </div>
                    </div>
                </div>
            `;
            viewArea.innerHTML = html;
            this.updateSelection();
        },

        updateSelection: function () {
            if (!App.auth.token) return;

            document.querySelectorAll('.profile-card').forEach((el, i) => {
                const container = el.querySelector('.avatar-container');
                if (!App.nav.inMenu && i === state.activeRow) {
                    el.style.transform = 'scale(1.15)';
                    container.style.borderColor = 'white';
                    container.style.boxShadow = '0 15px 40px rgba(145, 70, 255, 0.4)';
                    el.style.zIndex = '10';
                } else {
                    el.style.transform = 'scale(1)';
                    const isActuallyActive = i < App.profiles.length && App.profiles[i].id === App.activeProfileId;
                    container.style.borderColor = isActuallyActive ? '#bf94ff' : 'transparent';
                    container.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
                    el.style.zIndex = '1';
                }
            });
        },

        onMenuExit: function () {
            this.renderAuthenticated(); // Forza re-render per adattare il layout al menu nascosto
        },

        handleKey: function (e) {
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

            const maxRow = App.profiles.length;

            if (e.keyCode === 39 && state.activeRow < maxRow) { state.activeRow++; this.updateSelection(); }
            if (e.keyCode === 37 && state.activeRow > 0) { state.activeRow--; this.updateSelection(); }
            if (e.keyCode === 38) {
                App.nav.inMenu = true;
                App.nav.update();
                this.renderAuthenticated(); // Adatta il layout alla comparsa del menu
            }

            if (e.keyCode === 13) {
                if (state.activeRow < App.profiles.length) {
                    const clickedProfile = App.profiles[state.activeRow];
                    App.activeProfileId = clickedProfile.id;
                    localStorage.setItem('active_profile_id', App.activeProfileId);
                    App.authManager.loadProfiles();

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
                App.nav.inMenu = true;
                App.nav.update();
                this.renderAuthenticated();
            }
        },

        destroy: function () {
            state.isPolling = false;
            clearInterval(state.pollInterval);
            const viewArea = document.getElementById('main-view-area');
            if (viewArea) {
                const images = viewArea.querySelectorAll('img');
                images.forEach(img => img.src = '');
                viewArea.innerHTML = '';
            }
        }
    };
})();