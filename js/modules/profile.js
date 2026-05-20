(function () {
    var state = {
        isPolling: false,
        pollInterval: null,
        activeRow: 0
    };

    App.modules.profile = {
        init: function () {
            state.isPolling = false;
            state.activeRow = 0;
        },

        load: function () {
            this.render();
            return Promise.resolve();
        },

        render: function () {
            if (App.auth.token) {
                this.renderAuthenticated();
            } else {
                this.renderLogin();
            }
        },

        renderLogin: function () {
            var viewArea = document.getElementById('main-view-area');
            if (!viewArea) return;

            var html = '<div id="profile-view" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:calc(100vh - 140px); color:white;">' +
                '<div id="device-flow-container" class="activation-box" style="text-align:center;">' +
                    '<div style="font-size:28px; margin-bottom:20px;">' + App.t('loading') + '</div>' +
                '</div>' +
            '</div>';

            viewArea.innerHTML = html;
            if (!state.isPolling) {
                this.startDeviceFlow();
            }
        },

        renderAuthenticated: function () {
            var viewArea = document.getElementById('main-view-area');
            if (!viewArea) return;

            var html = '<div id="profile-view" style="padding-top:60px; color:white; display:flex; flex-direction:column; align-items:center; width: 100%;">' +
                '<h1 style="font-size:42px; margin-bottom:60px; font-weight:bold; letter-spacing:2px;">' + App.t('accounts_title').toUpperCase() + '</h1>' +
                '<div id="profiles-list" style="display:flex; justify-content:center; align-items:center; flex-wrap:wrap; padding:0 80px; width:100%; box-sizing:border-box;">';

            App.profiles.forEach(function (p, i) {
                var isActive = p.id === App.activeProfileId;
                html += '<div id="prof-opt-' + i + '" class="profile-card" style="display:flex; flex-direction:column; align-items:center; width:220px; transition:0.3s; margin: 0 25px;">' +
                    '<div class="avatar-container" style="position:relative; width:180px; height:180px; border-radius:50%; border:6px solid transparent; transition:0.3s;">' +
                        '<img src="' + p.img + '" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">' +
                        (isActive ? '<div style="position:absolute; bottom:5px; right:5px; background:#bf94ff; color:white; border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; font-size:24px; box-shadow:0 4px 10px rgba(0,0,0,0.5);">✓</div>' : '') +
                    '</div>' +
                    '<div style="margin-top:25px; font-size:26px; font-weight:bold; color:' + (isActive ? '#bf94ff' : 'white') + ';">' + p.name + '</div>' +
                '</div>';
            });

            // Add Account Button
            html += '<div id="prof-opt-' + App.profiles.length + '" class="profile-card" style="display:flex; flex-direction:column; align-items:center; width:220px; transition:0.3s; margin: 0 25px;">' +
                '<div class="avatar-container" style="width:180px; height:180px; border-radius:50%; background:#1f1f23; border:6px dashed #3a3a3d; display:flex; align-items:center; justify-content:center; margin-bottom:25px; transition: 0.3s;">' +
                    '<div style="font-size:80px; color:#adadb8; font-weight:100; line-height:0; display:flex; align-items:center; justify-content:center; width: 100%; height: 100%;">+</div>' +
                '</div>' +
                '<div style="font-size:26px; font-weight:bold; color:#adadb8;">' + App.t('add_account').toUpperCase() + '</div>' +
            '</div>';

            html += '</div></div>';
            viewArea.innerHTML = html;
            this.updateSelection();
        },

        updateSelection: function () {
            if (!App.auth.token) return;
            var maxIdx = App.profiles.length;
            for (var i = 0; i <= maxIdx; i++) {
                var el = document.getElementById('prof-opt-' + i);
                if (!el) continue;
                var container = el.querySelector('.avatar-container');
                if (i === state.activeRow) {
                    el.style.transform = 'scale(1.1)';
                    if (container) {
                        container.style.borderColor = '#bf94ff';
                        container.style.boxShadow = '0 0 30px rgba(191,148,255,0.6)';
                    }
                } else {
                    el.style.transform = 'scale(1)';
                    if (container) {
                        var isActuallyActive = (i < App.profiles.length && App.profiles[i].id === App.activeProfileId);
                        container.style.borderColor = isActuallyActive ? '#bf94ff' : 'transparent';
                        container.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
                    }
                }
            }
        },

        startDeviceFlow: function () {
            var self = this;
            state.isPolling = true;
            fetch('https://id.twitch.tv/oauth2/device', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'client_id=' + window.CLIENT_ID + '&scopes=user:read:follows user:read:subscriptions chat:read chat:edit'
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                var container = document.getElementById('device-flow-container');
                if (container) {
                    container.innerHTML = '<div style="font-size:32px; margin-bottom:20px;">' + App.t('login_goto') + ' <span style="color:#bf94ff; font-weight:bold;">twitch.tv/activate</span></div>' +
                        '<div style="font-size:64px; font-weight:bold; letter-spacing:8px; background:rgba(255,255,255,0.1); padding:20px 40px; border-radius:15px; margin-bottom:30px;">' + data.user_code + '</div>' +
                        '<div style="font-size:20px; color:#adadb8;">' + App.t('login_code_expire') + ' ' + Math.floor(data.expires_in / 60) + ' ' + App.t('login_minutes') + '</div>';
                }
                
                state.pollInterval = setInterval(function() { self.pollToken(data.device_code); }, data.interval * 1000);
            })
            .catch(function(err) {
                console.error("Device Flow Error", err);
            });
        },

        pollToken: function (deviceCode) {
            var self = this;
            fetch('https://id.twitch.tv/oauth2/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'client_id=' + window.CLIENT_ID + '&device_code=' + deviceCode + '&grant_type=urn:ietf:params:oauth:grant-type:device_code'
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (data.access_token) {
                    clearInterval(state.pollInterval);
                    self.finalizeLogin(data.access_token, data.refresh_token);
                }
            });
        },

        finalizeLogin: function (token, refresh) {
            var self = this;
            fetch('https://api.twitch.tv/helix/users', {
                headers: { 'Client-ID': window.CLIENT_ID, 'Authorization': 'Bearer ' + token }
            })
            .then(function(res) { return res.json(); })
            .then(function(userData) {
                if (userData.data && userData.data.length > 0) {
                    var user = userData.data[0];
                    var newProfile = { id: user.id, name: user.display_name, img: user.profile_image_url, token: token, refresh: refresh };
                    
                    var profiles = JSON.parse(localStorage.getItem('twitch_profiles')) || [];
                    var existingIdx = -1;
                    for (var i = 0; i < profiles.length; i++) {
                        if (profiles[i].id === user.id) {
                            existingIdx = i;
                            break;
                        }
                    }
                    
                    if (existingIdx !== -1) profiles[existingIdx] = newProfile;
                    else profiles.push(newProfile);
                    
                    localStorage.setItem('twitch_profiles', JSON.stringify(profiles));
                    localStorage.setItem('active_profile_id', user.id);
                    App.authManager.loadProfiles();

                    if (App.isStartupProfileSelect) {
                        App.isStartupProfileSelect = false;
                        if (App.notifications) App.notifications.init();
                        App.nav.focusIndex = 1;
                        App.nav.inMenu = true;
                        App.nav.update();
                        App.nav.navigateTo('home');
                    } else {
                        state.isPolling = false;
                        self.render();
                    }
                }
            });
        },

        handleKey: function (e) {
            if (!App.auth.token) return;
            var maxIdx = App.profiles.length;

            if (e.keyCode === 39 && state.activeRow < maxIdx) { state.activeRow++; this.updateSelection(); }
            if (e.keyCode === 37 && state.activeRow > 0) { state.activeRow--; this.updateSelection(); }
            if (e.keyCode === 38) {
                if (App.isStartupProfileSelect) return;
                App.nav.inMenu = true;
                App.nav.update();
                this.renderAuthenticated();
            }

            if (e.keyCode === 13) {
                if (state.activeRow < App.profiles.length) {
                    var clickedProfile = App.profiles[state.activeRow];
                    App.activeProfileId = clickedProfile.id;
                    localStorage.setItem('active_profile_id', App.activeProfileId);
                    App.authManager.loadProfiles();
                    
                    if (App.isStartupProfileSelect) {
                        App.isStartupProfileSelect = false;
                        if (App.notifications) App.notifications.init();
                        App.nav.focusIndex = 1;
                        App.nav.inMenu = true;
                        App.nav.update();
                        App.nav.navigateTo('home');
                    } else {
                        this.renderAuthenticated();
                    }
                } else {
                    state.isPolling = false;
                    clearInterval(state.pollInterval);
                    App.auth.token = '';
                    this.renderLogin();
                }
            }
        },

        destroy: function () {
            state.isPolling = false;
            clearInterval(state.pollInterval);
            var viewArea = document.getElementById('main-view-area');
            if (viewArea) viewArea.innerHTML = '';
        }
    };
})();