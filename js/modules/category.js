(function() {
    let state = {
        categoryData: null,
        streams: [],
        dataRows: [], // arrays di 3 streams
        activeRow: 0,
        activeCol: 0,
        seqId: 0,
        langFilter: ''
    };

    App.modules.category = {
        init: function() {
            // Viene richiamato quando il modulo viene caricato.
            // Lo stato viene pulito in open() per non perdere i dati se navighiamo avanti e indietro.
        },

        load: async function(isRestore) {
            if (isRestore && state.dataRows.length > 0) {
                this.render();
                return;
            }
        },

        open: async function(categoryObj) {
            state.categoryData = categoryObj;
            state.seqId = Date.now();
            state.activeRow = 0;
            state.activeCol = 0;
            state.langFilter = ''; // Se vogliamo filtrare per lingua, potremmo usare App.settings.language

            this.renderLoading();
            await this.fetchStreams();
        },

        fetchStreams: async function() {
            const mySeq = state.seqId;
            try {
                let url = `https://api.twitch.tv/helix/streams?game_id=${state.categoryData.id}&first=100`;
                if (state.langFilter) url += `&language=${state.langFilter}`;

                const res = await App.api.twitchFetch(url, {}, 60);
                if (mySeq !== state.seqId) return;

                state.streams = res.data || [];
                state.dataRows = [];
                for (let i = 0; i < state.streams.length; i += 3) {
                    state.dataRows.push(state.streams.slice(i, i + 3));
                }

                this.render();
            } catch (e) {
                if (mySeq !== state.seqId) return;
                console.error("Category Fetch Error", e);
                const viewArea = document.getElementById('main-view-area');
                if (viewArea) viewArea.innerHTML = `<div style="color:red; text-align:center; padding-top:100px;">Errore nel caricamento della categoria.</div>`;
            }
        },

        renderLoading: function() {
            const viewArea = document.getElementById('main-view-area');
            if (viewArea) {
                viewArea.innerHTML = `<div style="text-align:center; padding-top:100px; font-size:24px; color:white;">Caricamento ${state.categoryData.name}...</div>`;
            }
        },

        render: function() {
            const viewArea = document.getElementById('main-view-area');
            if (!viewArea) return;

            const boxArt = App.utils.getSafeThumb(state.categoryData.box_art_url, 'category');

            let html = `
                <div id="category-view" style="padding-bottom:60px;">
                    <div style="display:flex; align-items:flex-end; gap:30px; margin-bottom:40px; padding:0 80px; padding-top:20px;">
                        <img src="${boxArt}" style="width:150px; height:200px; border-radius:10px; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
                        <div>
                            <h1 style="font-size:48px; margin:0; color:white;">${state.categoryData.name}</h1>
                            <div style="font-size:20px; color:#adadb8; margin-top:10px;">${state.streams.length} canali live</div>
                        </div>
                    </div>
            `;

            if (state.dataRows.length === 0) {
                html += `<div style="text-align:center; padding-top:60px; color:#adadb8; font-size:24px;">Nessun canale in diretta trovato.</div>`;
            } else {
                html += `<div style="display:flex; flex-direction:column; gap:20px; align-items:center;">`;
                state.dataRows.forEach((row, rowIndex) => {
                    html += `<div id="cat-row-${rowIndex}" class="channel-grid" style="justify-content:flex-start; width: 1830px; gap: 15px;">`;
                    row.forEach((item, colIndex) => {
                        let thumb = App.utils.getSafeThumb(item.thumbnail_url, 'stream');
                        const viewers = App.utils.formatViewers(item.viewer_count);
                        html += `
                            <div id="cat-card-${rowIndex}-${colIndex}" class="channel-card follow-card">
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
                });
                html += `</div>`;
            }

            html += `</div>`;
            viewArea.innerHTML = html;
            this.updateSelection();
        },

        updateSelection: function() {
            document.querySelectorAll('#category-view .channel-card').forEach(el => el.classList.remove('selected'));
            
            if (state.dataRows.length > 0) {
                const card = document.getElementById(`cat-card-${state.activeRow}-${state.activeCol}`);
                if (card) {
                    card.classList.add('selected');
                    const rowEl = document.getElementById(`cat-row-${state.activeRow}`);
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
                const selectedStream = state.dataRows[state.activeRow][state.activeCol];
                const channelLogin = selectedStream.user_login || selectedStream.user_name;
                App.nav.navigateTo('player').then(() => {
                    if (App.modules.player && App.modules.player.openNativePlayer) {
                        App.modules.player.openNativePlayer(channelLogin, selectedStream.user_id, selectedStream.title);
                    }
                });
            } else if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) { // Back
                this.goBack();
            }
        },

        goBack: function() {
            // Torna al menu principale da dove siamo partiti (Home o Search)
            App.nav.inMenu = false; // per forzare l'aggiornamento
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