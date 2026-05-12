(function() {
    let state = {
        isPolling: false,
        pollInterval: null,
        deviceCode: '',
        userCode: '',
        statusMsg: '',
        activeRow: 0 // 0: accounts list, length: add account
    };

    App.modules.profile = {
        init: function() {
            state.isPolling = false;
            clearInterval(state.pollInterval);
            state.deviceCode = '';
            state.userCode = '';
            state.statusMsg = '';
            state.activeRow = 0;
        },

        load: async function() {
            if (App.auth.token) {
                this.renderAuthenticated();
            } else {
                this.startDeviceFlow();
            }
        },

        startDeviceFlow: async function() {
            this.renderUnauthenticated('Richiesta codice...');
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
                    state.statusMsg = `In attesa di autorizzazione...`;
                    this.renderUnauthenticated();
                    this.pollForToken(data.interval);
                } else {
                    this.renderUnauthenticated('Errore nella richiesta di login.');
                }
            } catch (e) {
                this.renderUnauthenticated('Errore di rete durante il login.');
            }
        },

        pollForToken: function(interval) {
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
                        
                        // Validazione per ottenere user_id
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
                        
                        // Evita duplicati
                        App.profiles = App.profiles.filter(p => p.id !== newProfile.id);
                        App.profiles.push(newProfile);
                        App.activeProfileId = newProfile.id;
                        localStorage.setItem('twitch_profiles', JSON.stringify(App.profiles));
                        localStorage.setItem('active_profile_id', App.activeProfileId);
                        
                        App.authManager.loadProfiles();
                        
                        // Ricarica la vista profilo ora che siamo loggati
                        this.renderAuthenticated();
                    } else if (data.message !== 'authorization_pending') {
                        clearInterval(state.pollInterval);
                        state.isPolling = false;
                        this.renderUnauthenticated('Login fallito o scaduto. Riprova.');
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, interval * 1000);
        },

        renderUnauthenticated: function(msg) {
            const viewArea = document.getElementById('main-view-area');
            if (!viewArea) return;

            let html = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:white; text-align:center;">
                    <img src="icon.png" style="width:150px; margin-bottom:30px;">
                    <h2 style="font-size:32px; margin-bottom:20px;">Accedi a Twitch TV</h2>
                    ${state.userCode ? `
                        <div style="font-size:24px; color:#adadb8; margin-bottom:10px;">Vai su <span style="color:white; font-weight:bold;">twitch.tv/activate</span></div>
                        <div style="font-size:24px; color:#adadb8; margin-bottom:30px;">Inserisci il codice:</div>
                        <div style="font-size:64px; font-weight:bold; letter-spacing:10px; background:#18181b; padding:20px 40px; border-radius:15px; border:2px solid #bf94ff;">${state.userCode}</div>
                        <div style="font-size:20px; color:#bf94ff; margin-top:30px;">${state.statusMsg}</div>
                    ` : `
                        <div style="font-size:24px; color:#adadb8;">${msg || 'Caricamento...'}</div>
                    `}
                </div>
            `;
            viewArea.innerHTML = html;
        },

        renderAuthenticated: async function() {
            const viewArea = document.getElementById('main-view-area');
            if (!viewArea) return;

            // Fetch info base utente per avatar
            let userAvatar = 'icon.png';
            try {
                const res = await App.api.twitchFetch(`https://api.twitch.tv/helix/users?id=${App.auth.userId}`);
                if (res && res.data && res.data[0]) {
                    userAvatar = res.data[0].profile_image_url;
                }
            } catch(e) {}

            let html = `
                <div style="display:flex; height:100%; color:white; padding-top:40px;">
                    <!-- Colonna sinistra: User info -->
                    <div style="width:400px; display:flex; flex-direction:column; align-items:center; border-right:2px solid #303032; padding:0 40px;">
                        <img src="${userAvatar}" style="width:200px; height:200px; border-radius:50%; border:4px solid #bf94ff; margin-bottom:20px;">
                        <h2 style="font-size:32px; margin:0;">${App.profiles.find(p=>p.id === App.activeProfileId)?.login || 'Utente'}</h2>
                    </div>
                    
                    <!-- Colonna destra: Accounts list -->
                    <div style="flex:1; padding:0 60px;">
                        <h3 style="font-size:26px; margin-bottom:30px; color:#adadb8;">${App.t('accounts_title')}</h3>
                        <div id="profile-accounts-list">
                            ${App.profiles.map((p, i) => `
                                <div id="prof-opt-${i}" class="profile-opt" style="display:flex; justify-content:space-between; align-items:center; padding:20px 30px; margin-bottom:15px; background:#18181b; border-radius:8px; font-size:24px; border:3px solid transparent; transition:0.2s;">
                                    <div style="font-weight:bold;">${p.login} ${p.id === App.activeProfileId ? '(Attivo)' : ''}</div>
                                    ${p.id === App.activeProfileId ? `
                                        <div style="color:#ff4f4f; font-size:18px;">Premi OK per scollegare</div>
                                    ` : `
                                        <div style="color:#bf94ff; font-size:18px;">Premi OK per passare</div>
                                    `}
                                </div>
                            `).join('')}
                            
                            <div id="prof-opt-${App.profiles.length}" class="profile-opt" style="display:flex; justify-content:center; align-items:center; padding:20px 30px; margin-top:30px; background:#303032; border-radius:8px; font-size:24px; border:3px solid transparent; transition:0.2s;">
                                + ${App.t('add_account')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            viewArea.innerHTML = html;
            
            // Assicuriamoci che activeRow sia nei limiti
            if (state.activeRow > App.profiles.length) state.activeRow = App.profiles.length;
            this.updateSelection();
        },

        updateSelection: function() {
            if (!App.auth.token) return; // Niente da selezionare nella schermata di login

            document.querySelectorAll('.profile-opt').forEach((el, i) => {
                if (!App.nav.inMenu && i === state.activeRow) {
                    el.style.borderColor = 'white';
                    el.style.transform = 'scale(1.02)';
                } else {
                    el.style.borderColor = 'transparent';
                    el.style.transform = 'scale(1)';
                }
            });
        },

        onMenuExit: function() {
            this.updateSelection();
        },

        handleKey: function(e) {
            if (!App.auth.token) {
                if (e.keyCode === 38 || e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
                    App.nav.inMenu = true;
                    App.nav.update();
                }
                return;
            }

            const maxRow = App.profiles.length; // length è l'indice del pulsante "Aggiungi"

            if (e.keyCode === 40 && state.activeRow < maxRow) { state.activeRow++; this.updateSelection(); }
            if (e.keyCode === 38 && state.activeRow > 0) { state.activeRow--; this.updateSelection(); }
            if (e.keyCode === 38 && state.activeRow === 0) { App.nav.inMenu = true; App.nav.update(); this.updateSelection(); }
            
            if (e.keyCode === 13) {
                if (state.activeRow < App.profiles.length) {
                    // Click su un account
                    const clickedProfile = App.profiles[state.activeRow];
                    if (clickedProfile.id === App.activeProfileId) {
                        // Logout
                        App.authManager.logout();
                    } else {
                        // Switch account
                        App.activeProfileId = clickedProfile.id;
                        localStorage.setItem('active_profile_id', App.activeProfileId);
                        App.authManager.loadProfiles();
                        this.renderAuthenticated();
                    }
                } else {
                    // Add account
                    state.isPolling = false;
                    clearInterval(state.pollInterval);
                    App.auth.token = ''; // Forza lo stato disconnesso per mostrare il flow
                    this.startDeviceFlow();
                }
            }

            if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
                App.nav.inMenu = true;
                App.nav.update();
                this.updateSelection();
            }
        },

        destroy: function() {
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