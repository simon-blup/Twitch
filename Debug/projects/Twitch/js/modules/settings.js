(function() {
    let state = {
        activeTab: 0, // 0: Appearance, 1: System
        activeRow: 0,
        inTabs: true
    };

    const tabs = ['tab_appearance', 'tab_system'];
    const opts = [
        [ // Appearance
            { id: 'theme', type: 'toggle', label: 'setting_theme', values: ['dark', 'light'] },
            { id: 'barPos', type: 'toggle', label: 'setting_bar_pos', values: ['center', 'left'] },
            { id: 'showFollowedAvatars', type: 'toggle', label: 'setting_avatars' }
        ],
        [ // System
            { id: 'performanceMode', type: 'toggle', label: 'setting_perf' },
            { id: 'adBlock', type: 'toggle', label: 'setting_adblock' },
            { id: 'language', type: 'select', label: 'setting_lang', values: ['English', 'Italiano', 'Español', '中文', 'Français'] }
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
                <div id="settings-view" style="display:flex; height:100%; color:white; padding-top:40px;">
                    <!-- Sidebar Tabs -->
                    <div style="width:300px; padding:0 40px; border-right:2px solid #303032;">
                        ${tabs.map((t, i) => `
                            <div id="set-tab-${i}" class="settings-tab" style="padding:15px 20px; margin-bottom:10px; border-radius:8px; font-size:24px; transition:0.2s;">
                                ${App.t(t)}
                            </div>
                        `).join('')}
                    </div>
                    
                    <!-- Options List -->
                    <div style="flex:1; padding:0 60px;">
                        ${opts[state.activeTab].map((o, i) => {
                            let valStr = '';
                            if (o.type === 'toggle' && o.values) {
                                valStr = App.settings[o.id] === o.values[0] ? App.t(o.values[0]) || o.values[0].toUpperCase() : App.t(o.values[1]) || o.values[1].toUpperCase();
                            } else if (o.type === 'toggle') {
                                valStr = App.settings[o.id] ? 'ON' : 'OFF';
                            } else if (o.type === 'select') {
                                valStr = App.settings[o.id] || o.values[0];
                            }
                            
                            return `
                                <div id="set-opt-${i}" class="settings-opt" style="display:flex; justify-content:space-between; align-items:center; padding:20px 30px; margin-bottom:15px; background:#18181b; border-radius:8px; font-size:24px; border:3px solid transparent; transition:0.2s;">
                                    <div>
                                        <div>${App.t(o.label)}</div>
                                        ${o.desc ? `<div style="font-size:16px; color:#adadb8; margin-top:5px;">${App.t(o.desc)}</div>` : ''}
                                    </div>
                                    <div style="color:#bf94ff; font-weight:bold;">${valStr}</div>
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
                if (state.inTabs && i === state.activeTab) {
                    el.style.background = 'white';
                    el.style.color = 'black';
                } else if (!state.inTabs && i === state.activeTab) {
                    el.style.background = '#303032';
                    el.style.color = 'white';
                } else {
                    el.style.background = 'transparent';
                    el.style.color = '#adadb8';
                }
            });

            // Update Options
            const currentOpts = opts[state.activeTab];
            currentOpts.forEach((o, i) => {
                const el = document.getElementById(`set-opt-${i}`);
                if (!el) return;
                if (!state.inTabs && i === state.activeRow) {
                    el.style.borderColor = 'white';
                    el.style.transform = 'scale(1.02)';
                } else {
                    el.style.borderColor = 'transparent';
                    el.style.transform = 'scale(1)';
                }
            });
        },

        onMenuExit: function() {
            state.inTabs = true;
            this.updateSelection();
        },

        handleKey: function(e) {
            if (state.inTabs) {
                if (e.keyCode === 40 && state.activeTab < tabs.length - 1) { state.activeTab++; this.render(); }
                if (e.keyCode === 38 && state.activeTab > 0) { state.activeTab--; this.render(); }
                if (e.keyCode === 38 && state.activeTab === 0) { App.nav.inMenu = true; App.nav.update(); this.updateSelection(); }
                if (e.keyCode === 39) { state.inTabs = false; state.activeRow = 0; this.updateSelection(); }
            } else {
                const currentLen = opts[state.activeTab].length;
                if (e.keyCode === 40 && state.activeRow < currentLen - 1) { state.activeRow++; this.updateSelection(); }
                if (e.keyCode === 38 && state.activeRow > 0) { state.activeRow--; this.updateSelection(); }
                if (e.keyCode === 37) { state.inTabs = true; this.updateSelection(); }
                if (e.keyCode === 13) {
                    const o = opts[state.activeTab][state.activeRow];
                    if (o.type === 'toggle' && o.values) {
                        App.settings[o.id] = App.settings[o.id] === o.values[0] ? o.values[1] : o.values[0];
                    } else if (o.type === 'toggle') {
                        App.settings[o.id] = !App.settings[o.id];
                    } else if (o.type === 'select') {
                        let currIdx = o.values.indexOf(App.settings[o.id]);
                        if (currIdx === -1) currIdx = 0;
                        currIdx = (currIdx + 1) % o.values.length;
                        App.settings[o.id] = o.values[currIdx];
                    }
                    
                    App.utils.saveSettings();
                    this.render(); // Re-render per aggiornare i testi (es. lingua)
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