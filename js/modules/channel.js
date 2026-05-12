(function() {
    let state = {
        channelLogin: '',
        channelData: null,
        followerCount: 0,
        isLive: false,
        liveStreamData: null,
        
        vods: [], // Array combinato di Live (se presente) + VODs
        clips: [],
        
        // Sezioni Verticali:
        // 1 = Striscia VODs
        // 2 = Bottone Tempo Clip
        // 3 = Striscia Clip
        activeSection: 1, 
        
        vodCol: 0,
        clipCol: 0,
        seqId: 0,
        
        timeIndex: 0,
        times: [
            { id: 7, label: 'days_7' },
            { id: 30, label: 'days_30' }
        ],
        
        // Ottimizzazione rendering
        visibleVods: 6,
        visibleClips: 6
    };

    App.modules.channel = {
        init: function() {},

        load: async function(isRestore) {
            if (isRestore && (state.vods.length > 0 || state.clips.length > 0)) {
                this.render();
            }
        },

        openChannelView: async function(login) {
            state.channelLogin = login.toLowerCase();
            state.seqId = Date.now();
            state.activeSection = 1; // Focus iniziale sui VODs
            state.vodCol = 0;
            state.clipCol = 0;
            state.channelData = null;
            state.followerCount = 0;
            state.isLive = false;
            state.liveStreamData = null;
            state.vods = [];
            state.clips = [];
            state.visibleVods = 6;
            state.visibleClips = 6;

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

                // 2. Fetch dei Follower
                try {
                    const folRes = await App.api.twitchFetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${state.channelData.id}`);
                    if (mySeq !== state.seqId) return;
                    state.followerCount = folRes.total || 0;
                } catch(e) {
                    console.error("Followers fetch error", e);
                }

                await Promise.all([
                    this.fetchVods(),
                    this.fetchClips()
                ]);

                if (mySeq !== state.seqId) return;
                
                // Se non ci sono VODs ma ci sono clip, partiamo dal bottone clip
                if (state.vods.length === 0 && state.clips.length > 0) {
                    state.activeSection = 2;
                }

                this.render();
            } catch (e) {
                if (mySeq !== state.seqId) return;
                console.error("Channel Fetch Error", e);
                const viewArea = document.getElementById('main-view-area');
                if (viewArea) viewArea.innerHTML = `<div style="color:red; text-align:center; padding-top:100px;">Errore caricamento canale.</div>`;
            }
        },

        fetchVods: async function() {
            const mySeq = state.seqId;
            try {
                // Controllo Live
                const liveRes = await App.api.twitchFetch(`https://api.twitch.tv/helix/streams?user_id=${state.channelData.id}`);
                if (mySeq !== state.seqId) return;

                let liveArr = [];
                if (liveRes.data && liveRes.data.length > 0) {
                    state.isLive = true;
                    state.liveStreamData = liveRes.data[0];
                    // Formattiamo il dato live per sembrare un VOD nella lista
                    liveArr.push({
                        isLiveItem: true,
                        id: state.liveStreamData.user_id, // Usiamo user_id per riaprire la live
                        title: state.liveStreamData.title,
                        user_name: state.liveStreamData.user_name,
                        view_count: state.liveStreamData.viewer_count,
                        thumbnail_url: state.liveStreamData.thumbnail_url,
                        created_at: state.liveStreamData.started_at,
                        duration: 'LIVE'
                    });
                }

                // VODs (Video recenti)
                const vidRes = await App.api.twitchFetch(`https://api.twitch.tv/helix/videos?user_id=${state.channelData.id}&first=50`);
                if (mySeq !== state.seqId) return;

                let rawVods = vidRes.data || [];
                // Se lo streamer è in live, escludi l'eventuale VOD della sessione corrente per evitare duplicati
                if (state.isLive && state.liveStreamData && state.liveStreamData.id) {
                    rawVods = rawVods.filter(v => v.stream_id !== state.liveStreamData.id);
                }

                const vodArr = rawVods.map(v => ({
                    isLiveItem: false,
                    id: v.id,
                    title: v.title,
                    user_name: v.user_name,
                    view_count: v.view_count,
                    thumbnail_url: v.thumbnail_url,
                    created_at: v.published_at,
                    duration: v.duration,
                    url: v.url
                }));

                state.vods = [...liveArr, ...vodArr];
            } catch (e) { console.error("Fetch Vods Error", e); }
        },

        fetchClips: async function() {
            const mySeq = state.seqId;
            try {
                const days = state.times[state.timeIndex].id;
                const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
                
                let url = `https://api.twitch.tv/helix/clips?broadcaster_id=${state.channelData.id}&started_at=${startDate}&first=50`;
                const res = await App.api.twitchFetch(url, {}, 300);
                if (mySeq !== state.seqId) return;
                state.clips = res.data || [];
            } catch (e) { console.error("Fetch Clips Error", e); }
        },

        renderLoading: function() {
            const viewArea = document.getElementById('main-view-area');
            if (viewArea) {
                viewArea.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100vh; font-size:24px; color:#adadb8;">${App.t('loading')}</div>`;
            }
        },

        render: function() {
            const viewArea = document.getElementById('main-view-area');
            if (!viewArea) return;

            const isLight = document.body.classList.contains('theme-light');
            const titleColor = isLight ? '#000' : 'white';
            
            // Banner sfumato dall'alto (Fallback sull'avatar ingrandito se offline_image manca)
            const banner = state.channelData.offline_image_url || state.channelData.profile_image_url || '';
            const isAvatarFallback = !state.channelData.offline_image_url;
            
            // Stile semplificato per massima compatibilità TV: usiamo box-shadow inset invece di mask-image per la sfumatura
            const bannerHtml = banner ? `
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 500px; z-index: -1; overflow: hidden; opacity: 0.4;">
                    <div style="width: 100%; height: 100%; background-image: url('${banner}'); background-size: cover; background-position: center; ${isAvatarFallback ? 'filter: blur(20px); transform: scale(1.2);' : ''}"></div>
                    <!-- Sfumatura CSS compatibile con tutti i browser -->
                    <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 200px; background: linear-gradient(to bottom, transparent, #0e0e10);"></div>
                </div>
            ` : '';

            let html = `
                <div id="channel-view" style="padding: 60px 0; color: white; width: 100vw; overflow-x: hidden; position: relative;">
                    ${bannerHtml}
                    
                    <!-- Header -->
                    <div style="display:flex; align-items:flex-start; gap:40px; margin-bottom:60px; padding: 0 80px;">
                        <div style="display:flex; gap:40px; flex:1;">
                            <img src="${state.channelData.profile_image_url}" style="width:180px; height:180px; border-radius:50%; border:6px solid #18181b; background:#18181b; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                            <div style="padding-top:20px;">
                                <h1 style="font-size:54px; margin:0; font-weight:bold; color:${titleColor};">${state.channelData.display_name}</h1>
                                <div style="font-size:20px; color:#adadb8; margin-top:10px; max-width: 800px; line-height: 1.4;">${state.channelData.description || 'Nessuna descrizione.'}</div>
                            </div>
                        </div>
                        <div style="padding-top:50px; text-align:right;">
                            <div style="font-size:22px; font-weight:bold; color:${titleColor};">${App.utils.formatViewers(state.followerCount)}</div>
                            <div style="font-size:14px; color:#adadb8; text-transform:uppercase; letter-spacing:1px;">${App.t('followers')}</div>
                        </div>
                    </div>

                    <!-- Sezione VODs / Live -->
                    <div id="section-1" style="margin-bottom:60px; ${state.vods.length === 0 ? 'display:none;' : ''}">
                        <div style="display:flex; align-items:center; gap:20px; margin-bottom:20px; padding: 0 80px;">
                            <h2 style="font-size:32px; margin:0;">Video ${state.isLive ? '& Diretta' : ''}</h2>
                        </div>
                        <div style="width: 100%; overflow: visible;">
                            <div id="chan-vods-strip" style="display:flex; gap:20px; padding: 10px 80px; transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1); transform: translateX(0px);">
                                ${this.renderVodItems()}
                            </div>
                        </div>
                    </div>

                    <!-- Sezione Clip -->
                    <div id="section-3" style="margin-bottom:60px; ${state.clips.length === 0 && state.vods.length > 0 ? 'display:none;' : ''}">
                        <div style="display:flex; align-items:center; gap:20px; margin-bottom:20px; padding: 0 80px;">
                            <h2 style="font-size:32px; margin:0;">${App.t('clips')}</h2>
                            <div id="chan-btn-time" class="cat-filter-btn" style="padding:8px 20px; background:#bf94ff; color:black; border-radius:30px; border:3px solid transparent; font-size:18px; font-weight:bold; transition:0.2s; display:flex; align-items:center; gap:12px;">
                                <span>${App.t(state.times[state.timeIndex].label)}</span>
                                <div style="display:flex; flex-direction:column; line-height:0.8; font-size:10px; opacity:0.8;"><span>▲</span><span>▼</span></div>
                            </div>
                        </div>
                        <div style="width: 100%; overflow: visible;">
                            <div id="chan-clips-strip" style="display:flex; gap:20px; padding: 10px 80px; transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1); transform: translateX(0px);">
                                ${this.renderClipItems()}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            viewArea.innerHTML = html;
            this.updateSelection();
        },

        renderVodItems: function() {
            if (state.vods.length === 0) return `<div style="color:#adadb8; font-size:20px;">Nessun video trovato.</div>`;
            return state.vods.slice(0, state.visibleVods).map((v, i) => {
                
                // Parser specifico e sicuro per i VOD e le Live
                let thumb = 'https://vod-secure.twitch.tv/_404/404_processing_600x338.png';
                if (v.thumbnail_url) {
                    thumb = v.thumbnail_url
                             .replace('%{width}', '600').replace('%{height}', '338')
                             .replace('{width}', '600').replace('{height}', '338');
                }
                
                const durationBadge = v.isLiveItem 
                    ? `<div class="badge-live">LIVE</div>` 
                    : `<div class="badge-live" style="background:rgba(0,0,0,0.8);">${v.duration}</div>`;
                
                const viewerBadge = v.isLiveItem
                    ? `<div class="badge-viewers">${App.utils.formatViewers(v.view_count)}</div>`
                    : `<div class="badge-viewers no-dot" style="top:20px; right:20px; bottom:auto; left:auto;">${App.utils.formatViewers(v.view_count)} views</div>`;

                return `
                    <div id="chan-item-1-${i}" class="channel-card follow-card" style="flex:0 0 600px; width:600px;">
                        ${durationBadge}
                        ${viewerBadge}
                        <img src="${thumb}" onerror="this.src='https://vod-secure.twitch.tv/_404/404_processing_600x338.png'" style="width:100%; height:100%; object-fit:cover;">
                        <div class="card-info">
                            <div style="font-size:22px; font-weight:bold; color:white;">${v.title}</div>
                            <div style="font-size:16px; color:#adadb8; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${new Date(v.created_at).toLocaleDateString()}</div>
                        </div>
                    </div>
                `;
            }).join('');
        },

        renderClipItems: function() {
            if (state.clips.length === 0) return `<div style="color:#adadb8; font-size:20px;">Nessuna clip trovata.</div>`;
            return state.clips.slice(0, state.visibleClips).map((c, i) => {
                const thumb = c.thumbnail_url;
                return `
                    <div id="chan-item-3-${i}" class="channel-card follow-card" style="flex:0 0 600px; width:600px;">
                        <div class="badge-viewers no-dot" style="top:20px; right:20px; bottom:auto; left:auto;">${App.utils.formatViewers(c.view_count)} views</div>
                        <img src="${thumb}" loading="lazy" style="width:100%; height:100%; object-fit:cover;">
                        <div class="card-info">
                            <div style="font-size:22px; font-weight:bold; color:white;">${c.title}</div>
                            <div style="font-size:16px; color:#adadb8; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.creator_name}</div>
                        </div>
                    </div>
                `;
            }).join('');
        },

        updateSelection: function() {
            // Reset
            document.querySelectorAll('.cat-filter-btn').forEach(el => {
                el.style.borderColor = 'transparent';
                el.style.background = '#bf94ff';
                el.style.color = 'black';
                el.style.transform = 'scale(1)';
            });
            document.querySelectorAll('.channel-card').forEach(el => el.classList.remove('selected'));

            let targetContainer = null;

            if (state.activeSection === 2) {
                const btn = document.getElementById('chan-btn-time');
                if (btn) {
                    btn.style.borderColor = 'white';
                    btn.style.background = '#a970ff';
                    btn.style.transform = 'scale(1.05)';
                    targetContainer = document.getElementById('section-3');
                }
            } else if (state.activeSection === 1) {
                const item = document.getElementById(`chan-item-1-${state.vodCol}`);
                if (item) {
                    item.classList.add('selected');
                }
                const strip = document.getElementById('chan-vods-strip');
                if (strip) strip.style.transform = `translateX(-${state.vodCol * 620}px)`;
                targetContainer = document.getElementById('section-1');
            } else if (state.activeSection === 3) {
                const item = document.getElementById(`chan-item-3-${state.clipCol}`);
                if (item) {
                    item.classList.add('selected');
                }
                const strip = document.getElementById('chan-clips-strip');
                if (strip) strip.style.transform = `translateX(-${state.clipCol * 620}px)`;
                targetContainer = document.getElementById('section-3');
            }

            if (targetContainer) {
                targetContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (App.nav.inMenu) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        },

        handleKey: function(e) {
            if (e.keyCode === 39) { // Right
                if (state.activeSection === 1) {
                    if (state.vodCol < state.vods.length - 1) {
                        state.vodCol++;
                        if (state.vodCol >= state.visibleVods - 2) {
                            state.visibleVods += 3;
                            document.getElementById('chan-vods-strip').innerHTML = this.renderVodItems();
                        }
                    }
                } else if (state.activeSection === 3) {
                    if (state.clipCol < state.clips.length - 1) {
                        state.clipCol++;
                        if (state.clipCol >= state.visibleClips - 2) {
                            state.visibleClips += 3;
                            document.getElementById('chan-clips-strip').innerHTML = this.renderClipItems();
                        }
                    }
                }
            } else if (e.keyCode === 37) { // Left
                if (state.activeSection === 1 && state.vodCol > 0) {
                    state.vodCol--;
                } else if (state.activeSection === 3 && state.clipCol > 0) {
                    state.clipCol--;
                }
            } else if (e.keyCode === 40) { // Down
                if (state.activeSection === 1) {
                    if (state.clips.length > 0) {
                        state.activeSection = 2; // Va al bottone tempo clip
                    }
                } else if (state.activeSection === 2) {
                    if (state.clips.length > 0) state.activeSection = 3;
                }
            } else if (e.keyCode === 38) { // Up
                if (state.activeSection === 3) {
                    state.activeSection = 2;
                } else if (state.activeSection === 2) {
                    if (state.vods.length > 0) state.activeSection = 1;
                }
            } else if (e.keyCode === 13) { // OK
                if (state.activeSection === 2) { // Time
                    state.timeIndex = (state.timeIndex + 1) % state.times.length;
                    this.refreshClips();
                } else if (state.activeSection === 1) {
                    const v = state.vods[state.vodCol];
                    if (v.isLiveItem) {
                        App.nav.navigateTo('player').then(() => {
                            App.modules.player.openNativePlayer(v.user_name, v.id, v.title);
                        });
                    } else {
                        // Riproduzione VOD
                        alert("La riproduzione dei VOD richiede l'integrazione con l'API Usher per i VOD.");
                    }
                } else if (state.activeSection === 3) {
                    const c = state.clips[state.clipCol];
                    App.nav.navigateTo('player').then(() => {
                        App.modules.player.openNativePlayer(c.creator_name, state.channelData.id, c.title, c.url);
                    });
                }
            } else if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
                this.goBack();
                return;
            }
            this.updateSelection();
        },

        refreshClips: async function() {
            state.clips = [];
            state.visibleClips = 6;
            state.clipCol = 0;
            const strip = document.getElementById('chan-clips-strip');
            if (strip) {
                strip.style.transform = 'translateX(0px)';
                strip.innerHTML = `<div style="color:#adadb8; font-size:18px;">${App.t('loading')}</div>`;
            }
            await this.fetchClips();
            if (strip) strip.innerHTML = this.renderClipItems();
            
            const btn = document.getElementById('chan-btn-time');
            if (btn) btn.querySelector('span').innerText = App.t(state.times[state.timeIndex].label);
            this.updateSelection();
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