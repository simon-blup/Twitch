(function() {
    var state = {
        activeRow: 0
    };

    var allOpts = [
        { id: 'theme', type: 'toggle', label: 'setting_theme', values: ['dark', 'dark'] }, 
        { id: 'barPos', type: 'toggle', label: 'setting_bar_pos', values: ['center', 'center'] }, 
        { id: 'showFollowedAvatars', type: 'toggle', label: 'setting_avatars' },
        { id: 'performanceMode', type: 'toggle', label: 'setting_perf' },
        { id: 'notifications', type: 'toggle', label: 'setting_notifications' },
        { id: 'adBlock', type: 'toggle', label: 'setting_adblock' },
        { id: 'language', type: 'select', label: 'setting_lang', values: ['English', 'Italiano', 'Español', '中文', 'Français'] },
        { id: 'logout', type: 'action', label: 'setting_remove', color: 'danger' }
    ];

    App.modules.settings = {
        init: function() {
            state.activeRow = 0;
        },

        load: function() {
            this.render();
            return Promise.resolve();
        },

        render: function() {
            var viewArea = document.getElementById('main-view-area');
            if (!viewArea) return;

            App.settings.theme = 'dark';
            var filteredOpts = allOpts.filter(function(o) { return o.id !== 'theme'; });

            var html = '<div id="settings-view" style="padding-top: 40px; color: white;">' +
                    '<h1 style="text-align:center; font-size:42px; margin-bottom:40px;">' + App.t('menu_settings').toUpperCase() + '</h1>' +
                    '<div class="settings-options-container" style="display:flex; flex-direction:column; align-items:center; gap:15px;">';
            
            var hasAppearanceHeader = false;
            var hasSystemHeader = false;

            html += filteredOpts.map(function(o, i) {
                var controlHtml = '';
                if (o.type === 'toggle') {
                    var isOn = o.values 
                        ? App.settings[o.id] === o.values[0] 
                        : !!App.settings[o.id];
                    controlHtml = '<div class="settings-switch ' + (isOn ? 'on' : '') + '"></div>';
                } else if (o.type === 'select') {
                    controlHtml = '<div class="settings-value-text" style="display:flex; align-items:center; justify-content:center; gap:15px; margin:0;">' +
                            '<span style="opacity: 0.5; font-size: 14px;">◀</span> ' +
                            App.settings[o.id] +
                            ' <span style="opacity: 0.5; font-size: 14px;">▶</span>' +
                        '</div>';
                }
                
                var prefixHtml = '';
                if (o.id === 'barPos' && !hasAppearanceHeader) {
                    prefixHtml = '<div style="width:800px; padding: 20px 0 10px 0; color:#adadb8; font-size:20px; font-weight:bold; letter-spacing:1px; border-bottom:1px solid rgba(255,255,255,0.1); margin-bottom:10px;">' + App.t('tab_appearance') + '</div>';
                    hasAppearanceHeader = true;
                }
                if (o.id === 'performanceMode' && !hasSystemHeader) {
                    prefixHtml = '<div style="width:800px; padding: 30px 0 10px 0; color:#adadb8; font-size:20px; font-weight:bold; letter-spacing:1px; border-bottom:1px solid rgba(255,255,255,0.1); margin-bottom:10px; margin-top:20px;">' + App.t('tab_system') + '</div>';
                    hasSystemHeader = true;
                }
                
                return prefixHtml + '<div id="set-opt-' + i + '" class="settings-row ' + (o.color === 'danger' ? 'danger' : '') + '" style="width:800px; display:flex; justify-content:space-between; align-items:center; padding:25px 40px; background:#18181b; border-radius:20px; border:3px solid transparent;">' +
                        '<div class="settings-label" style="font-size:24px; margin:0;">' + App.t(o.label) + '</div>' +
                        controlHtml +
                    '</div>';
            }).join('');
            
            html += '</div></div>';
            viewArea.innerHTML = html;
            this.updateSelection();
        },

        updateSelection: function() {
            var filteredOpts = allOpts.filter(function(o) { return o.id !== 'theme'; });
            filteredOpts.forEach(function(o, i) {
                var el = document.getElementById('set-opt-' + i);
                if (!el) return;
                if (i === state.activeRow) {
                    el.style.borderColor = 'white';
                    el.style.background = '#26262c';
                    el.style.transform = 'scale(1.02)';
                } else {
                    el.style.borderColor = 'transparent';
                    el.style.background = '#18181b';
                    el.style.transform = 'scale(1)';
                }
            });
        },

        onMenuExit: function() { this.updateSelection(); },

        handleKey: function(e) {
            var filteredOpts = allOpts.filter(function(o) { return o.id !== 'theme'; });
            var currentLen = filteredOpts.length;
            if (e.keyCode === 40 && state.activeRow < currentLen - 1) { 
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
            if (e.keyCode === 13 || e.keyCode === 37 || e.keyCode === 39) { 
                var o = filteredOpts[state.activeRow];
                if (!o) return;

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

            if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
                App.nav.inMenu = true;
                App.nav.update();
                this.updateSelection();
            }
        },

        destroy: function() {
            var viewArea = document.getElementById('main-view-area');
            if (viewArea) viewArea.innerHTML = '';
        }
    };
})();