(function() {
    let state = {
        channelLogin: '',
        channelData: null,
        isLive: false,
        liveStreamData: null,
        videos: [],
        dataRows: [], // 0: Play Button/Live Button row, 1...n: VODs (3 per row)
        activeRow: 0,
        activeCol: 0,
        seqId: 0
    };

    App.modules.channel = {
        init: function() {},

        load: async function(isRestore) {
            if (isRestore && state.dataRows.length > 0) {
                this.render();
                return;
            }
        },

        openChannelView: async function(login) {
            state.channelLogin = login.toLowerCase();
            state.seqId = Date.now();
            state.activeRow = 0;
            state.activeCol = 0;
            state.channelData = null;
            state.isLive = false;
            state.liveStreamData = null;
            state.videos = [];
            state.dataRows = [];

            this.renderLoading();
            await this.fetchChannelData();
        },

        fetchChannelData: async function() {
            const mySeq = state.seqId;
            try {
                // 1. Dati Utente
                const userRes = await App.api.twitchFetch(`https://api.twitch.tv/helix/users?login=${state.channelLogin}`);
                if (mySeq !== state.seqId) return;
                
                if (!userRes.data || userRes.data.length === 0) {
                    throw new Error("Canale non trovato");
                }
                state.channelData = userRes.data[0];

                // 2. Controllo Live
                const liveRes = await App.api.twitchFetch(`https://api.twitch.tv/helix/streams?user_id=${state.channelData.id}`);
                if (mySeq !== state.seqId) return;

                if (liveRes.data && liveRes.data.length > 0) {
                    state.isLive = true;
                    state.liveStreamData = liveRes.data[0];
                }

                // 3. VODs (Video recenti)
                const vidRes = await App.api.twitchFetch(`https://api.twitch.tv/helix/videos?user_id=${state.channelData.id}&first=30`);
                if (mySeq !== state.seqId) return;

                state.videos = vidRes.data || [];

                this.buildDataRows();
                this.render();
            } catch (e) {
                if (mySeq !== state.seqId) return;
                console.error("Channel Fetch Error", e);
                const viewArea = document.getElementById('main-view-area');
                if (viewArea) viewArea.innerHTML = `<div style="color:red; text-align:center; padding-top:100px;">Errore caricamento canale.</div>`;
            }
        },

        buildDataRows: function() {
            state.dataRows = [];
            
            // Row 0: Action Buttons (Watch Live)
            const actionRow = [];
            if (state.isLive) {
                actionRow.push({ type: 'action_live', label: 'Guarda la Diretta' });
            }
            state.dataRows.push(actionRow);

            // Row 1...n: VODs (3 per row)
            for (let i = 0; i < state.videos.length; i += 3) {
                state.dataRows.push(state.videos.slice(i, i + 3).map(v => ({ type: 'vod', data: v })));
            }
            
            // Se la riga 0 è vuota (non è live), la rimuoviamo per non avere un dead-end di navigazione
            if (state.dataRows[0].length === 0) {
                state.dataRows.shift();
            }
        },

        renderLoading: function() {
            const viewArea = document.getElementById('main-view-area');
            if (viewArea) {
                viewArea.innerHTML = `<div style="text-align:center; padding-top:100px; font-size:24px; color:white;">Caricamento ${state.channelLogin}...</div>`;
            }
        },

        render: function() {
            const viewArea = document.getElementById('main-view-area');
            if (!viewArea) return;

            const isLight = document.body.classList.contains('theme-light');
            const titleColor = isLight ? '#000' : 'white';
            
            // Genera banner se disponibile, altrimenti un gradiente
            const banner = state.channelData.offline_image_url || '';
            const bannerHtml = banner ? `<div class="channel-header" style="background-image: url('${banner}');"></div>` 
                                      : `<div class="channel-header"></div>`;

            let html = `
                <div id="channel-view" style="padding-bottom:60px;">
                    ${bannerHtml}
                    <div style="display:flex; align-items:flex-end; gap:30px; margin-top:-75px; padding:0 80px; margin-bottom:40px; position:relative; z-index:2;">
                        <img src="${state.channelData.profile_image_url}" style="width:150px; height:150px; border-radius:50%; border:4px solid #18181b; background:#18181b;">
                        <div style="padding-bottom:10px;">
                            <h1 style="font-size:48px; margin:0; color:${titleColor};">${state.channelData.display_name}</h1>
                            <div style="font-size:20px; color:#adadb8; margin-top:5px;">${state.channelData.description || 'Nessuna descrizione.'}</div>
                        </div>
                    </div>
            `;

            if (state.dataRows.length === 0) {
                html += `<div style="text-align:center; padding-top:60px; color:#adadb8; font-size:24px;">Nessun contenuto disponibile.</div>`;
            } else {
                html += `<div style="display:flex; flex-direction:column; gap:30px; align-items:flex-start; padding: 0 80px;">`;
                
                state.dataRows.forEach((row, rowIndex) => {
                    if (row.length === 0) return;

                    // Gestione riga azioni (Live)
                    if (row[0].type === 'action_live') {
                        html += `<div id="chan-row-${rowIndex}" style="display:flex; gap:20px;">`;
                        row.forEach((item, colIndex) => {
                            html += `
                                <div id="chan-card-${rowIndex}-${colIndex}" class="channel-action-btn" style="padding: 15px 40px; background: #9146ff; color: white; font-size: 24px; font-weight: bold; border-radius: 8px; border: 3px solid transparent; transition: 0.2s;">
                                    ${item.label}
                                </div>`;
                        });
                        html += `</div>`;
                        return;
                    }

                    // Gestione riga VODs
                    html += `<div id="chan-row-${rowIndex}" class="channel-grid" style="justify-content:flex-start; width: 100%; gap: 20px;">`;
                    row.forEach((item, colIndex) => {
                        const vod = item.data;
                        let thumb = App.utils.getSafeThumb(vod.thumbnail_url, 'stream');
                        if(thumb === 'icon.png' || !vod.thumbnail_url) {
                            thumb = 'https://vod-secure.twitch.tv/_404/404_processing_600x338.png';
                        }
                        
                        html += `
                            <div id="chan-card-${rowIndex}-${colIndex}" class="channel-card follow-card" style="width: 500px; height: 281px;">
                                <div class="badge-live" style="background:rgba(0,0,0,0.8);">${vod.duration}</div>
                                <div class="badge-viewers" style="left:10px; right:auto;">${vod.view_count} visualizzazioni</div>
                                <img src="${thumb}" loading="lazy" onerror="this.src='https://vod-secure.twitch.tv/_404/404_processing_600x338.png'" style="width:100%; height:100%; object-fit:cover;">
                                <div class="card-info">
                                    <div style="font-size:20px; font-weight:bold; color:white; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${vod.title}</div>
                                    <div style="font-size:16px; color:#adadb8; margin-top:6px;">${new Date(vod.published_at).toLocaleDateString()}</div>
                                </div>
                            </div>`;
                    });
                    html += `</div>`;
                });
                
                html += `</div>`;
            }

            html += `</div>`;
            viewArea.innerHTML = html;
            this.updateSelection();
        },

        updateSelection: function() {
            document.querySelectorAll('#channel-view .channel-card, #channel-view .channel-action-btn').forEach(el => {
                el.classList.remove('selected');
                el.style.borderColor = 'transparent';
                el.style.transform = 'scale(1)';
            });
            
            if (state.dataRows.length > 0) {
                const card = document.getElementById(`chan-card-${state.activeRow}-${state.activeCol}`);
                if (card) {
                    if (state.dataRows[state.activeRow][0].type === 'action_live') {
                        card.style.borderColor = 'white';
                        card.style.transform = 'scale(1.05)';
                    } else {
                        card.classList.add('selected');
                    }
                    const rowEl = document.getElementById(`chan-row-${state.activeRow}`);
                    if (rowEl) rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        },

        handleKey: function(e) {
            if (state.dataRows.length === 0) {
                if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
                    this.goBack();
                }
                return;
            }

            if (e.keyCode === 39) { // Right
                if (state.activeCol < state.dataRows[state.activeRow].length - 1) state.activeCol++;
                this.updateSelection();
            } else if (e.keyCode === 37) { // Left
                if (state.activeCol > 0) state.activeCol--;
                this.updateSelection();
            } else if (e.keyCode === 40) { // Down
                if (state.activeRow < state.dataRows.length - 1) {
                    state.activeRow++;
                    if (state.activeCol >= state.dataRows[state.activeRow].length) {
                        state.activeCol = state.dataRows[state.activeRow].length - 1;
                    }
                    this.updateSelection();
                }
            } else if (e.keyCode === 38) { // Up
                if (state.activeRow > 0) {
                    state.activeRow--;
                    if (state.activeCol >= state.dataRows[state.activeRow].length) {
                        state.activeCol = state.dataRows[state.activeRow].length - 1;
                    }
                    this.updateSelection();
                }
            } else if (e.keyCode === 13) { // OK
                const selectedItem = state.dataRows[state.activeRow][state.activeCol];
                if (selectedItem.type === 'action_live') {
                    App.nav.navigateTo('player').then(() => {
                        if (App.modules.player && App.modules.player.openNativePlayer) {
                            App.modules.player.openNativePlayer(state.channelLogin, state.channelData.id, state.liveStreamData.title);
                        }
                    });
                } else if (selectedItem.type === 'vod') {
                    // Nota: Per riprodurre un VOD servirebbe una logica specifica su getStreamM3u8 (vod invece di live)
                    // Per ora lo apriamo nel player nativo che proverà a leggerlo se implementato, o darà errore.
                    // Molti client di terze parti su TV supportano solo le Live, ma passiamo comunque l'ID.
                    alert("La riproduzione dei VOD richiede l'integrazione con l'API Usher per i VOD.");
                }
            } else if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) { // Back
                this.goBack();
            }
        },

        goBack: function() {
            App.nav.inMenu = false;
            const prevModule = App.nav.menuMap[App.nav.focusIndex] || 'home';
            App.nav.navigateTo(prevModule).then(() => {
                if (App.modules[prevModule] && App.modules[prevModule].updateSelection) {
                    App.modules[prevModule].updateSelection();
                }
            });
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