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
                        this.renderAuthenticated();
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

        renderUnauthenticated: function(msg) {
            const viewArea = document.getElementById('main-view-area');
            if (!viewArea) return;

            let html = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; width:100vw; position:fixed; top:0; left:0; background:#0e0e10; color:white; text-align:center; z-index:1000;">
                    <!-- Logo in alto -->
                    <img src="icon.png" style="width:100px; position:absolute; top:60px;">
                    
                    ${state.userCode ? `
                        <!-- Contenitore Principale -->
                        <div style="position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
                            
                            <!-- QR Code centrato tra lato sinistro e centro -->
                            <div style="position:absolute; left:25%; transform:translateX(-50%); background:white; padding:15px; border-radius:15px; box-shadow: 0 0 30px rgba(145, 70, 255, 0.3);">
                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://www.twitch.tv/activate?user_code=${state.userCode}" style="width:180px; height:180px; display:block;">
                            </div>

                            <!-- Box Codice al centro esatto dello schermo -->
                            <div style="background:#18181b; padding:40px 60px; border-radius:30px; border:4px solid #bf94ff; box-shadow: 0 0 50px rgba(145, 70, 255, 0.2);">
                                <div style="font-size:80px; font-weight:bold; letter-spacing:12px; margin-bottom:15px;">${state.userCode}</div>
                                <div style="font-size:32px; color:#bf94ff; font-weight:bold; letter-spacing:2px;">twitch.tv/activate</div>
                            </div>

                        </div>
                    ` : `
                        <div style="font-size:28px; color:#adadb8; font-weight:300; letter-spacing:2px;">${msg || App.t('loading').toUpperCase()}</div>
                    `}
                </div>
            `;
            viewArea.innerHTML = html;
        },

        renderAuthenticated: async function() {
            const viewArea = document.getElementById('main-view-area');
            if (!viewArea) return;

            let userAvatar = 'icon.png';
            try {
                const res = await App.api.twitchFetch(`https://api.twitch.tv/helix/users?id=${App.auth.userId}`);
                if (res && res.data && res.data[0]) {
                    userAvatar = res.data[0].profile_image_url;
                }
            } catch(e) {}

            let html = `
                <div style="display:flex; height:100%; color:white; padding-top:40px;">
                    <div style="width:400px; display:flex; flex-direction:column; align-items:center; border-right:2px solid #303032; padding:0 40px;">
                        <img src="${userAvatar}" style="width:200px; height:200px; border-radius:50%; border:4px solid #bf94ff; margin-bottom:20px;">
                        <h2 style="font-size:32px; margin:0;">${App.profiles.find(p=>p.id === App.activeProfileId)?.login || 'Utente'}</h2>
                    </div>
                    <div style="flex:1; padding:0 60px;">
                        <h3 style="font-size:26px; margin-bottom:30px; color:#adadb8;">${App.t('accounts_title')}</h3>
                        <div id="profile-accounts-list">
                            ${App.profiles.map((p, i) => `
                                <div id="prof-opt-${i}" class="profile-opt" style="display:flex; justify-content:space-between; align-items:center; padding:20px 30px; margin-bottom:15px; background:#18181b; border-radius:8px; font-size:24px; border:3px solid transparent; transition:0.2s;">
                                    <div style="font-weight:bold;">${p.login} ${p.id === App.activeProfileId ? '(Attivo)' : ''}</div>
                                    <div style="color:#bf94ff; font-size:18px;">${p.id === App.activeProfileId ? 'OK per scollegare' : 'OK per passare'}</div>
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
            this.updateSelection();
        },

        updateSelection: function() {
            if (!App.auth.token) return;
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
                // Blocco totale menu durante il login
                return;
            }

            const maxRow = App.profiles.length;
            if (e.keyCode === 40 && state.activeRow < maxRow) { state.activeRow++; this.updateSelection(); }
            if (e.keyCode === 38 && state.activeRow > 0) { state.activeRow--; this.updateSelection(); }
            if (e.keyCode === 38 && state.activeRow === 0) { App.nav.inMenu = true; App.nav.update(); this.updateSelection(); }
            
            if (e.keyCode === 13) {
                if (state.activeRow < App.profiles.length) {
                    const clickedProfile = App.profiles[state.activeRow];
                    if (clickedProfile.id === App.activeProfileId) {
                        App.authManager.logout();
                    } else {
                        App.activeProfileId = clickedProfile.id;
                        localStorage.setItem('active_profile_id', App.activeProfileId);
                        App.authManager.loadProfiles();
                        this.renderAuthenticated();
                    }
                } else {
                    state.isPolling = false;
                    clearInterval(state.pollInterval);
                    App.auth.token = '';
                    this.startDeviceFlow();
                }
            }

            if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
                App.nav.inMenu = true; App.nav.update(); this.updateSelection();
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