(function() {
    let state = {
        categoryData: null,
        streams: [],
        clips: [],
        
        // Sezioni Verticali:
        // 0 = Bottone Lingua
        // 1 = Striscia Live
        // 2 = Bottone Tempo
        // 3 = Striscia Clip
        activeSection: 1, 
        
        streamCol: 0,
        clipCol: 0,
        seqId: 0,
        
        // Filtri
        langIndex: 0,
        langs: [
            { id: 'en', label: 'lang_en_only' },
            { id: 'it', label: 'lang_it' },
            { id: 'fr', label: 'lang_fr' },
            { id: 'es', label: 'lang_es' },
            { id: 'zh', label: 'lang_zh' }
        ],
        timeIndex: 0,
        times: [
            { id: 7, label: 'days_7' },
            { id: 30, label: 'days_30' }
        ],
        
        // Ottimizzazione rendering
        visibleStreams: 6,
        visibleClips: 6
    };

    App.modules.category = {
        init: function() {},

        load: async function(isRestore) {
            if (isRestore && (state.streams.length > 0 || state.clips.length > 0)) {
                this.render();
            }
        },

        open: async function(categoryObj) {
            state.categoryData = categoryObj;
            state.seqId = Date.now();
            state.activeSection = 1; // Focus iniziale sulla prima live
            state.streamCol = 0;
            state.clipCol = 0;
            state.streams = [];
            state.clips = [];
            state.visibleStreams = 6;
            state.visibleClips = 6;
            
            // Imposta la lingua del filtro in base alla lingua globale dell'app se possibile
            const currentGlobalLang = App.settings.language || 'English';
            const foundIndex = state.langs.findIndex(l => App.t(l.label) === currentGlobalLang || l.label === currentGlobalLang);
            if (foundIndex !== -1) state.langIndex = foundIndex;

            this.renderLoading();
            await Promise.all([
                this.fetchStreams(),
                this.fetchClips()
            ]);
            
            // Se non ci sono stream ma ci sono clip, partiamo dalle clip
            if (state.streams.length === 0 && state.clips.length > 0) {
                state.activeSection = 3;
            } else if (state.streams.length === 0 && state.clips.length === 0) {
                state.activeSection = 0; // Se è tutto vuoto, focus sul bottone lingua
            }

            this.render();
        },

        fetchStreams: async function() {
            const mySeq = state.seqId;
            try {
                let url = `https://api.twitch.tv/helix/streams?game_id=${state.categoryData.id}&first=50`;
                
                const selectedLang = state.langs[state.langIndex].id;
                if (selectedLang === 'en') {
                    url += `&language=en`;
                } else {
                    url += `&language=${selectedLang}&language=en`;
                }

                const res = await App.api.twitchFetch(url, {}, 60);
                if (mySeq !== state.seqId) return;
                state.streams = res.data || [];
            } catch (e) { console.error("Fetch Streams Error", e); }
        },

        fetchClips: async function() {
            const mySeq = state.seqId;
            try {
                const days = state.times[state.timeIndex].id;
                const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
                
                let url = `https://api.twitch.tv/helix/clips?game_id=${state.categoryData.id}&started_at=${startDate}&first=40`;
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

            // Ricalcoliamo una stima dei viewers basata sugli stream caricati
            const totalViewers = state.streams.reduce((acc, s) => acc + s.viewer_count, 0);
            const boxArt = App.utils.getSafeThumb(state.categoryData.box_art_url, 'category');
            const plusSign = (state.streams.length >= 40 || totalViewers > 1000) ? '+' : '';

            let html = `
                <!-- Nessun padding laterale globale per permettere lo scorrimento a tutto schermo -->
                <div id="category-view" style="padding: 40px 0; color: white; width: 100vw; overflow-x: hidden;">
                    
                    <!-- Header: Titolo e Spettatori -->
                    <div style="display:flex; align-items:center; gap:40px; margin-bottom:50px; padding: 0 80px;">
                        <img src="${boxArt}" style="width:120px; height:160px; border-radius:10px; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
                        <div>
                            <h1 style="font-size:54px; margin:0; font-weight:bold;">${state.categoryData.name}</h1>
                            <div style="font-size:24px; color:#bf94ff; margin-top:10px; font-weight:bold;">
                                ${plusSign}${App.utils.formatViewers(totalViewers)} ${App.t('viewers')}
                            </div>
                        </div>
                    </div>

                    <!-- Sezione Canali Live -->
                    <div id="section-1" style="margin-bottom:60px;">
                        <div style="display:flex; align-items:center; gap:20px; margin-bottom:20px; padding: 0 80px;">
                            <h2 style="font-size:32px; margin:0;">${App.t('search_live')}</h2>
                            <div id="cat-btn-lang" class="cat-filter-btn" style="padding:8px 20px; background:#bf94ff; color:black; border-radius:30px; border:3px solid transparent; font-size:18px; font-weight:bold; transition:0.2s; display:flex; align-items:center; gap:12px;">
                                <span>${App.t(state.langs[state.langIndex].label)}</span>
                                <div style="display:flex; flex-direction:column; line-height:0.8; font-size:10px; opacity:0.8;"><span>▲</span><span>▼</span></div>
                            </div>
                        </div>
                        <div style="width: 100%; overflow: visible;">
                            <div id="cat-streams-strip" style="display:flex; gap:20px; padding: 10px 80px; transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1); transform: translateX(0px);">
                                ${this.renderStreamItems()}
                            </div>
                        </div>
                    </div>

                    <!-- Sezione Clip -->
                    <div id="section-3" style="margin-bottom:60px;">
                        <div style="display:flex; align-items:center; gap:20px; margin-bottom:20px; padding: 0 80px;">
                            <h2 style="font-size:32px; margin:0;">${App.t('clips')}</h2>
                            <div id="cat-btn-time" class="cat-filter-btn" style="padding:8px 20px; background:#bf94ff; color:black; border-radius:30px; border:3px solid transparent; font-size:18px; font-weight:bold; transition:0.2s; display:flex; align-items:center; gap:12px;">
                                <span>${App.t(state.times[state.timeIndex].label)}</span>
                                <div style="display:flex; flex-direction:column; line-height:0.8; font-size:10px; opacity:0.8;"><span>▲</span><span>▼</span></div>
                            </div>
                        </div>
                        <div style="width: 100%; overflow: visible;">
                            <div id="cat-clips-strip" style="display:flex; gap:20px; padding: 10px 80px; transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1); transform: translateX(0px);">
                                ${this.renderClipItems()}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            viewArea.innerHTML = html;
            this.updateSelection();
        },

        renderStreamItems: function() {
            if (state.streams.length === 0) return `<div style="color:#adadb8; font-size:20px;">Nessun canale live trovato.</div>`;
            return state.streams.slice(0, state.visibleStreams).map((s, i) => {
                const thumb = App.utils.getSafeThumb(s.thumbnail_url, 'stream');
                return `
                    <div id="cat-item-1-${i}" class="channel-card follow-card" style="flex:0 0 600px; width:600px;">
                        <div class="badge-live">LIVE</div>
                        <div class="badge-viewers">${App.utils.formatViewers(s.viewer_count)}</div>
                        <img src="${thumb}" style="width:100%; height:100%; object-fit:cover;">
                        <div class="card-info">
                            <div style="font-size:22px; font-weight:bold; color:white;">${s.user_name}</div>
                            <div style="font-size:16px; color:#adadb8; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.title}</div>
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
                    <div id="cat-item-3-${i}" class="channel-card follow-card" style="flex:0 0 600px; width:600px;">
                        <!-- no-dot rimosso il pallino rosso -->
                        <div class="badge-viewers no-dot" style="top:20px; right:20px; bottom:auto; left:auto;">${App.utils.formatViewers(c.view_count)} views</div>
                        <img src="${thumb}" style="width:100%; height:100%; object-fit:cover;">
                        <div class="card-info">
                            <div style="font-size:22px; font-weight:bold; color:white;">${c.title}</div>
                            <div style="font-size:16px; color:#adadb8; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.creator_name}</div>
                        </div>
                    </div>
                `;
            }).join('');
        },

        updateSelection: function() {
            // Reset Bottoni
            document.querySelectorAll('.cat-filter-btn').forEach(el => {
                el.style.borderColor = 'transparent';
                el.style.background = '#bf94ff';
                el.style.color = 'black';
                el.style.transform = 'scale(1)';
            });
            // Reset Card
            document.querySelectorAll('.channel-card').forEach(el => el.classList.remove('selected'));

            let targetContainer = null;

            if (state.activeSection === 0) {
                const btn = document.getElementById('cat-btn-lang');
                if (btn) {
                    btn.style.borderColor = 'white';
                    btn.style.background = '#a970ff';
                    btn.style.transform = 'scale(1.05)';
                    targetContainer = document.getElementById('section-1');
                }
            } else if (state.activeSection === 2) {
                const btn = document.getElementById('cat-btn-time');
                if (btn) {
                    btn.style.borderColor = 'white';
                    btn.style.background = '#a970ff';
                    btn.style.transform = 'scale(1.05)';
                    targetContainer = document.getElementById('section-3');
                }
            } else if (state.activeSection === 1) {
                const item = document.getElementById(`cat-item-1-${state.streamCol}`);
                if (item) {
                    item.classList.add('selected');
                }
                // Trasla l'intera striscia per uno scorrimento perfetto. Offset = (larghezza card 600 + gap 20)
                const strip = document.getElementById('cat-streams-strip');
                if (strip) strip.style.transform = `translateX(-${state.streamCol * 620}px)`;
                targetContainer = document.getElementById('section-1');
            } else if (state.activeSection === 3) {
                const item = document.getElementById(`cat-item-3-${state.clipCol}`);
                if (item) {
                    item.classList.add('selected');
                }
                // Trasla l'intera striscia per uno scorrimento perfetto
                const strip = document.getElementById('cat-clips-strip');
                if (strip) strip.style.transform = `translateX(-${state.clipCol * 620}px)`;
                targetContainer = document.getElementById('section-3');
            }

            // Scroll Verticale Nativo (Non usare sulle card singole altrimenti rompono il translateX!)
            if (targetContainer) {
                targetContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (App.nav.inMenu) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        },

        handleKey: function(e) {
            if (e.keyCode === 39) { // Right
                if (state.activeSection === 1) {
                    if (state.streamCol < state.streams.length - 1) {
                        state.streamCol++;
                        if (state.streamCol >= state.visibleStreams - 2) {
                            state.visibleStreams += 3;
                            document.getElementById('cat-streams-strip').innerHTML = this.renderStreamItems();
                        }
                    }
                } else if (state.activeSection === 3) {
                    if (state.clipCol < state.clips.length - 1) {
                        state.clipCol++;
                        if (state.clipCol >= state.visibleClips - 2) {
                            state.visibleClips += 3;
                            document.getElementById('cat-clips-strip').innerHTML = this.renderClipItems();
                        }
                    }
                }
            } else if (e.keyCode === 37) { // Left
                if (state.activeSection === 1 && state.streamCol > 0) {
                    state.streamCol--;
                } else if (state.activeSection === 3 && state.clipCol > 0) {
                    state.clipCol--;
                }
            } else if (e.keyCode === 40) { // Down
                if (state.activeSection === 0) {
                    if (state.streams.length > 0) state.activeSection = 1;
                    else state.activeSection = 2;
                } else if (state.activeSection === 1) {
                    state.activeSection = 2; // Va sempre al bottone tempo
                } else if (state.activeSection === 2) {
                    if (state.clips.length > 0) state.activeSection = 3;
                }
            } else if (e.keyCode === 38) { // Up
                if (state.activeSection === 3) {
                    state.activeSection = 2;
                } else if (state.activeSection === 2) {
                    if (state.streams.length > 0) state.activeSection = 1;
                    else state.activeSection = 0;
                } else if (state.activeSection === 1) {
                    state.activeSection = 0;
                }
            } else if (e.keyCode === 13) { // OK
                if (state.activeSection === 0) { // Lang
                    state.langIndex = (state.langIndex + 1) % state.langs.length;
                    this.refreshStreams();
                } else if (state.activeSection === 2) { // Time
                    state.timeIndex = (state.timeIndex + 1) % state.times.length;
                    this.refreshClips();
                } else if (state.activeSection === 1) {
                    const s = state.streams[state.streamCol];
                    App.nav.navigateTo('player').then(() => {
                        App.modules.player.openNativePlayer(s.user_login || s.user_name, s.user_id, s.title);
                    });
                } else if (state.activeSection === 3) {
                    const c = state.clips[state.clipCol];
                    App.nav.navigateTo('player').then(() => {
                        App.modules.player.openNativePlayer(c.broadcaster_name, c.broadcaster_id, c.title, c.url);
                    });
                }
            } else if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
                this.goBack();
                return;
            }
            this.updateSelection();
        },

        refreshStreams: async function() {
            state.streams = [];
            state.visibleStreams = 6;
            state.streamCol = 0;
            const strip = document.getElementById('cat-streams-strip');
            if (strip) {
                strip.style.transform = 'translateX(0px)';
                strip.innerHTML = `<div style="color:#adadb8; font-size:18px;">${App.t('loading')}</div>`;
            }
            await this.fetchStreams();
            if (strip) strip.innerHTML = this.renderStreamItems();
            
            const btn = document.getElementById('cat-btn-lang');
            if (btn) btn.querySelector('span').innerText = App.t(state.langs[state.langIndex].label);
            this.updateSelection();
        },

        refreshClips: async function() {
            state.clips = [];
            state.visibleClips = 6;
            state.clipCol = 0;
            const strip = document.getElementById('cat-clips-strip');
            if (strip) {
                strip.style.transform = 'translateX(0px)';
                strip.innerHTML = `<div style="color:#adadb8; font-size:18px;">${App.t('loading')}</div>`;
            }
            await this.fetchClips();
            if (strip) strip.innerHTML = this.renderClipItems();
            
            const btn = document.getElementById('cat-btn-time');
            if (btn) btn.querySelector('span').innerText = App.t(state.times[state.timeIndex].label);
            this.updateSelection();
        },

        goBack: function() {
            App.nav.inMenu = false;
            const prevModule = App.nav.menuMap[App.nav.focusIndex] || 'home';
            App.nav.navigateTo(prevModule);
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