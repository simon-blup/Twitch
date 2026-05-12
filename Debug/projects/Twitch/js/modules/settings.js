(function() {
    let state = {
        activeTab: 0, // 0: Appearance, 1: System
        activeRow: 0,
        inTabs: true
    };

    const tabs = [
        { 
            label: 'tab_appearance', 
            icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>` 
        },
        { 
            label: 'tab_system', 
            icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>` 
        }
    ];

    const opts = [
        [ // Appearance
            { id: 'theme', type: 'toggle', label: 'setting_theme', values: ['dark', 'light'] },
            { id: 'barPos', type: 'toggle', label: 'setting_bar_pos', values: ['center', 'left'] },
            { id: 'showFollowedAvatars', type: 'toggle', label: 'setting_avatars' }
        ],
        [ // System
            { id: 'performanceMode', type: 'toggle', label: 'setting_perf' },
            { id: 'adBlock', type: 'toggle', label: 'setting_adblock' },
            { id: 'language', type: 'select', label: 'setting_lang', values: ['English', 'Italiano', 'Español', '中文', 'Français'] },
            { id: 'logout', type: 'action', label: 'setting_remove', color: 'danger' }
        ]
    ];

    App.modules.settings = {
        init: function() {
            state.activeTab = 0;
            state.activeRow = 0;
            state.inTabs = true;
        },

        load: async function() {
            this.render();
        },

        render: function() {
            const viewArea = document.getElementById('main-view-area');
            if (!viewArea) return;

            let html = `
                <div id="settings-view" style="padding-top: 40px; color: white;">
                    <!-- Tabs Menu -->
                    <div class="settings-tabs-container">
                        ${tabs.map((t, i) => `
                            <div id="set-tab-${i}" class="settings-tab ${i === state.activeTab ? 'active' : ''}">
                                <span style="font-size: 32px;">${t.icon}</span>
                                <span>${App.t(t.label)}</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <!-- Options List -->
                    <div class="settings-options-container">
                        ${opts[state.activeTab].map((o, i) => {
                            let controlHtml = '';
                            
                            if (o.type === 'toggle') {
                                const isOn = o.values 
                                    ? App.settings[o.id] === o.values[0] 
                                    : !!App.settings[o.id];
                                controlHtml = `<div class="settings-switch ${isOn ? 'on' : ''}"></div>`;
                            } else if (o.type === 'select') {
                                controlHtml = `
                                    <div class="settings-value-text">
                                        <span style="opacity: 0.5; font-size: 14px;">◀</span>
                                        ${App.settings[o.id]}
                                        <span style="opacity: 0.5; font-size: 14px;">▶</span>
                                    </div>`;
                            }
                            
                            return `
                                <div id="set-opt-${i}" class="settings-row ${o.color === 'danger' ? 'danger' : ''}">
                                    <div class="settings-label">${App.t(o.label)}</div>
                                    ${controlHtml}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
            viewArea.innerHTML = html;
            this.updateSelection();
        },

        updateSelection: function() {
            // Update Tabs
            tabs.forEach((t, i) => {
                const el = document.getElementById(`set-tab-${i}`);
                if (!el) return;
                el.classList.toggle('active', i === state.activeTab);
                el.classList.toggle('focused', state.inTabs && i === state.activeTab);
            });

            // Update Options
            const currentOpts = opts[state.activeTab];
            currentOpts.forEach((o, i) => {
                const el = document.getElementById(`set-opt-${i}`);
                if (!el) return;
                el.classList.toggle('focused', !state.inTabs && i === state.activeRow);
            });
        },

        onMenuExit: function() {
            state.inTabs = true;
            this.updateSelection();
        },

        handleKey: function(e) {
            if (state.inTabs) {
                if (e.keyCode === 39 && state.activeTab < tabs.length - 1) { // Right
                    state.activeTab++;
                    this.render();
                }
                if (e.keyCode === 37 && state.activeTab > 0) { // Left
                    state.activeTab--;
                    this.render();
                }
                if (e.keyCode === 38) { // Up to main menu
                    App.nav.inMenu = true;
                    App.nav.update();
                    this.updateSelection();
                }
                if (e.keyCode === 40) { // Down to options
                    state.inTabs = false;
                    state.activeRow = 0;
                    this.updateSelection();
                }
            } else {
                const currentLen = opts[state.activeTab].length;
                if (e.keyCode === 40 && state.activeRow < currentLen - 1) { // Down
                    state.activeRow++; 
                    this.updateSelection(); 
                }
                if (e.keyCode === 38) { // Up
                    if (state.activeRow > 0) {
                        state.activeRow--;
                        this.updateSelection();
                    } else {
                        state.inTabs = true;
                        this.updateSelection();
                    }
                }
                if (e.keyCode === 13 || e.keyCode === 37 || e.keyCode === 39) { // Interaction
                    const o = opts[state.activeTab][state.activeRow];
                    
                    if (o.type === 'toggle') {
                        if (e.keyCode === 13) {
                            if (o.values) {
                                App.settings[o.id] = App.settings[o.id] === o.values[0] ? o.values[1] : o.values[0];
                            } else {
                                App.settings[o.id] = !App.settings[o.id];
                            }
                        }
                    } else if (o.type === 'select') {
                        let currIdx = o.values.indexOf(App.settings[o.id]);
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

        destroy: function() {
            const viewArea = document.getElementById('main-view-area');
            if (viewArea) viewArea.innerHTML = '';
        }
    };
})();