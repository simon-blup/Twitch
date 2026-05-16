(function() {
    let state = {
        dataRows: [],
        activeRow: 0,
        activeCol: 0,
        seqId: 0
    };

    App.modules.follow = {
        init: function() {
            state = {
                dataRows: [],
                activeRow: 0,
                activeCol: 0,
                seqId: Date.now()
            };
        },

        load: async function(isRestore) {
            if (isRestore && state.dataRows.length > 0) {
                this.render();
                return;
            }
            
            const mySeq = state.seqId;
            if (!App.auth.token) {
                this.render();
                return;
            }
            try {
                const folRes = await App.api.twitchFetch(`https://api.twitch.tv/helix/streams/followed?user_id=${App.auth.userId}&first=100`, {}, 30);
                let streams = folRes.data || [];

                let liveUsers = [];
                if (streams.length > 0 && App.settings.showFollowedAvatars) {
                    const userIds = streams.map(s => `id=${s.user_id}`).join('&');
                    try {
                        const userRes = await App.api.twitchFetch(`https://api.twitch.tv/helix/users?${userIds}`, {}, 60);
                        if (userRes && userRes.data) {
                            liveUsers = userRes.data;
                        }
                    } catch (e) { console.error("Error fetching live users for follow", e); }
                }

                for (let i = 0; i < streams.length; i += 3) {
                    state.dataRows.push({ type: "stream", data: streams.slice(i, i + 3) });
                }
                if (state.dataRows.length === 0) {
                    state.dataRows.push({ type: "empty", data: [{}] });
                }
                if (liveUsers.length > 0) {
                    state.dataRows.push({ type: "avatars", data: liveUsers });
                }

                if (mySeq !== state.seqId) return;
                this.render();
            } catch (e) {
                console.error(e);
                const va = document.getElementById('main-view-area');
                if (va) va.innerHTML = `<div style="color:red; text-align:center; padding-top:100px;">Loading error.</div>`;
            }
        },

        render: function() {
            const viewArea = document.getElementById('main-view-area');
            if (!viewArea) return;

            let html = '<div id="follow-view" style="padding-top:20px; padding-bottom:60px; display:flex; flex-direction:column; align-items:center; gap:20px;">';
            state.dataRows.forEach((row, rowIndex) => {
                if (row.type === 'empty') {
                    html += `<div style="color:white; font-size:30px; margin-top:100px;">${App.t('no_live')}</div>`;
                } else if (row.type === 'stream') {
                    html += `<div id="follow-row-${rowIndex}" class="channel-grid" style="justify-content:flex-start; width: 1830px; gap: 15px;">`;
                    row.data.forEach((item, colIndex) => {
                        let thumb = App.utils.getSafeThumb(item.thumbnail_url, 'stream');
                        const viewers = App.utils.formatViewers(item.viewer_count);
                        html += `
                            <div id="follow-card-${rowIndex}-${colIndex}" class="channel-card">
                                <div class="badge-live">LIVE</div>
                                <div class="badge-viewers">${viewers}</div>
                                <img src="${thumb}" loading="lazy" onerror="this.src='icon.png'" style="width:100%; height:100%; object-fit:cover;">
                                <div class="card-info">
                                    <div style="font-size:22px; font-weight:bold; color:white;">${item.user_name}</div>
                                    <div style="font-size:16px; color:#adadb8; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.title}</div>
                                </div>
                            </div>`;
                    });
                    html += `</div>`;
                } else if (row.type === 'avatars') {
                    if (App.settings.showFollowedAvatars) {
                        html += `<div class="live-avatars-bar" id="follow-row-${rowIndex}">`;
                        row.data.forEach((item, colIndex) => {
                            html += `<img src="${item.profile_image_url}" id="follow-card-${rowIndex}-${colIndex}" class="live-avatar-small" />`;
                        });
                        html += `</div>`;
                    }
                }
            });

            html += '</div>';
            viewArea.innerHTML = html;
            this.updateSelection();
        },

        updateSelection: function() {
            if (state.dataRows.length === 0) return;
            const currentRowData = state.dataRows[state.activeRow];

            document.querySelectorAll('#follow-view .channel-card, #follow-view .live-avatar-small').forEach(c => c.classList.remove('selected'));

            if (!App.nav.inMenu && currentRowData && (currentRowData.type === 'stream' || currentRowData.type === 'avatars')) {
                const card = document.getElementById(`follow-card-${state.activeRow}-${state.activeCol}`);
                if (card) {
                    card.classList.add('selected');
                }
                if (currentRowData.type === 'stream') {
                    const rowEl = document.getElementById(`follow-row-${state.activeRow}`);
                    if (rowEl) rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                }
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        },

        onMenuExit: function() {
            this.updateSelection();
        },

        handleKey: function(e) {
            if (state.dataRows.length === 0) return;
            const currentRowData = state.dataRows[state.activeRow];
            
            if (currentRowData.type === 'empty') {
                if (e.keyCode === 38) { 
                    App.nav.inMenu = true; 
                    App.nav.update(); 
                    this.updateSelection(); 
                }
                return;
            }
            if (e.keyCode === 39) {
                if (state.activeCol < currentRowData.data.length - 1) state.activeCol++;
                this.updateSelection();
            } else if (e.keyCode === 37) {
                if (state.activeCol > 0) state.activeCol--;
                this.updateSelection();
            } else if (e.keyCode === 40) {
                if (state.activeRow < state.dataRows.length - 1) {
                    state.activeRow++;
                    if (state.activeCol >= state.dataRows[state.activeRow].data.length) {
                        state.activeCol = state.dataRows[state.activeRow].data.length - 1;
                    }
                    this.updateSelection();
                }
            } else if (e.keyCode === 38) {
                if (state.activeRow > 0) {
                    state.activeRow--;
                    if (state.activeCol >= state.dataRows[state.activeRow].data.length) {
                        state.activeCol = state.dataRows[state.activeRow].data.length - 1;
                    }
                    this.updateSelection();
                } else {
                    App.nav.inMenu = true; 
                    App.nav.update(); 
                    this.updateSelection();
                }
            } else if (e.keyCode === 13) {
                if (currentRowData.type === 'stream') {
                    const selectedStream = currentRowData.data[state.activeCol];
                    App.nav.navigateTo('player').then(() => {
                        if (App.modules.player && App.modules.player.openNativePlayer) {
                            App.modules.player.openNativePlayer(selectedStream.user_name || selectedStream.user_login, selectedStream.user_id, selectedStream.title);
                        }
                    });
                } else if (currentRowData.type === 'avatars') {
                    const selectedAvatar = currentRowData.data[state.activeCol];
                    App.nav.navigateTo('channel').then(() => {
                        if (App.modules.channel && App.modules.channel.openChannelView) {
                            App.modules.channel.openChannelView(selectedAvatar.login);
                        }
                    });
                }
            }
            if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
                App.nav.inMenu = true;
                App.nav.update();
                this.updateSelection();
            }
        },

        destroy: function() {
            state.seqId++;
            const viewArea = document.getElementById('main-view-area');
            if (viewArea) {
                const images = viewArea.querySelectorAll('img');
                images.forEach(img => img.src = '');
                viewArea.innerHTML = '';
            }
        }
    };
})();