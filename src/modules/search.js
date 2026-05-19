(function() {
    let state = {
        dataRows: [],
        activeRow: 0,
        activeCol: 0,
        colIndices: [],
        isInputFocused: false,
        searchSequence: 0
    };
    
    let searchTimeout = null;

    App.modules.search = {
        init: function() {
            state = {
                dataRows: [],
                activeRow: -1, // -1 means focus is on input
                activeCol: 0,
                colIndices: [],
                isInputFocused: false,
                searchSequence: 0
            };
            
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                const newListener = (e) => {
                    clearTimeout(searchTimeout);
                    const q = e.target.value.trim();
                    if (q.length < 2) {
                        const resultsArea = document.getElementById('search-results-area');
                        if (resultsArea) resultsArea.innerHTML = '';
                        state.dataRows = [];
                        return;
                    }
                    searchTimeout = setTimeout(() => this.executeSearch(q), 400);
                };
                
                if (searchInput._searchHandler) {
                    searchInput.removeEventListener('input', searchInput._searchHandler);
                }
                searchInput.addEventListener('input', newListener);
                searchInput._searchHandler = newListener;
                
                searchInput.value = '';
            }
        },

        load: async function(isRestore) {
            if (isRestore && state.dataRows && state.dataRows.length > 0) {
                const viewArea = document.getElementById('main-view-area');
                if (viewArea && !document.getElementById('search-view')) {
                    viewArea.innerHTML = `
                        <div id="search-view" style="padding-bottom: 60px;">
                            <div id="search-results-area"></div>
                        </div>`;
                }
                this.render();
                this.updateInputUI();
                return;
            }

            const viewArea = document.getElementById('main-view-area');
            if (viewArea) {
                viewArea.innerHTML = `
                    <div id="search-view" style="padding-bottom: 60px;">
                        <div id="search-results-area"></div>
                    </div>`;
            }
            state.isInputFocused = true;
            this.updateInputUI();
        },
        
        updateInputUI: function() {
            const searchInput = document.getElementById('search-input');
            const searchDropdown = document.getElementById('search-dropdown');
            if (searchInput && searchDropdown) {
                if (state.isInputFocused || (App.nav.inMenu && App.nav.focusIndex === 0)) {
                    searchDropdown.classList.add('search-open');
                    searchInput.disabled = false;
                    if (state.isInputFocused) {
                        searchInput.classList.add('search-focused');
                        setTimeout(() => { searchInput.focus(); }, 100);
                    } else {
                        searchInput.classList.remove('search-focused');
                        searchInput.blur();
                    }
                } else {
                    searchDropdown.classList.remove('search-open');
                    searchInput.classList.remove('search-focused');
                    searchInput.blur();
                    searchInput.disabled = true;
                }
            }
        },

        executeSearch: async function(query) {
            const resultsArea = document.getElementById('search-results-area');
            if (!resultsArea) return;

            try {
                state.searchSequence++;
                const mySearchSeq = state.searchSequence;

                const [chRes, catRes] = await Promise.all([
                    App.api.twitchFetch(`https://api.twitch.tv/helix/search/channels?query=${encodeURIComponent(query)}&first=20`),
                    App.api.twitchFetch(`https://api.twitch.tv/helix/search/categories?query=${encodeURIComponent(query)}&first=10`)
                ]);

                if (mySearchSeq !== state.searchSequence) return;

                const channels = chRes.data || [];
                const categories = catRes.data || [];

                const liveChannels = channels.filter(c => c.is_live);
                const allChannels = channels;

                let liveStreams = [];
                if (liveChannels.length > 0) {
                    const userIds = liveChannels.map(c => `user_id=${c.id}`).join('&');
                    try {
                        const streamRes = await App.api.twitchFetch(`https://api.twitch.tv/helix/streams?${userIds}`);
                        if (mySearchSeq !== state.searchSequence) return;
                        liveStreams = streamRes.data || [];
                    } catch (e) { console.error("Error fetching live streams", e); }
                }

                let popularCategories = [];
                if (categories.length > 0) {
                    const catPromises = categories.map(async (cat) => {
                        try {
                            const stRes = await App.api.twitchFetch(`https://api.twitch.tv/helix/streams?game_id=${cat.id}&first=100`);
                            let viewers = 0;
                            if (stRes && stRes.data) {
                                viewers = stRes.data.reduce((sum, stream) => sum + stream.viewer_count, 0);
                            }
                            cat.viewer_count = viewers;
                        } catch (e) { cat.viewer_count = 0; }
                        return cat;
                    });
                    await Promise.all(catPromises);
                    popularCategories = categories.filter(c => c.viewer_count >= 100);
                }

                if (allChannels.length > 0) {
                    const followerPromises = allChannels.map(async (c) => {
                        try {
                            const folRes = await App.api.twitchFetch(`https://api.twitch.tv/helix/users/follows?to_id=${c.id}`);
                            c.follower_count = folRes.total || 0;
                        } catch (e) {
                            c.follower_count = 0;
                        }
                        return c;
                    });
                    await Promise.all(followerPromises);
                    if (mySearchSeq !== state.searchSequence) return;
                    allChannels.sort((a, b) => b.follower_count - a.follower_count);
                }

                state.dataRows = [];
                const limit = App.settings.performanceMode ? 4 : 7;

                if (liveStreams.length > 0) {
                    state.dataRows.push({ title: App.t('search_live'), type: 'live', data: liveStreams.slice(0, limit) });
                }
                if (popularCategories.length > 0) {
                    state.dataRows.push({ title: App.t('search_categories'), type: 'category', data: popularCategories.slice(0, limit) });
                }
                if (allChannels.length > 0) {
                    state.dataRows.push({ title: App.t('channels'), type: 'channel', data: allChannels.slice(0, limit) });
                }

                if (state.dataRows.length === 0) {
                    resultsArea.innerHTML = `<div style="text-align:center; padding-top:60px; color:#adadb8; font-size:24px;">Nessun risultato per "${query}"</div>`;
                    return;
                }

                if (state.isInputFocused || App.nav.inMenu) {
                    state.activeRow = -1;
                    state.activeCol = 0;
                    state.colIndices = new Array(state.dataRows.length).fill(0);
                }
                this.render();
            } catch (e) {
                console.error(e);
                resultsArea.innerHTML = `<div style="color:red; text-align:center; padding-top:60px;">Errore nella ricerca.</div>`;
            }
        },

        render: function() {
            const resultsArea = document.getElementById('search-results-area');
            if (!resultsArea) return;
            const isLight = document.body.classList.contains('theme-light');
            const titleColor = isLight ? '#000' : 'white';

            let html = `<div style="display:flex; flex-direction:column; min-height:calc(100vh - 340px); padding-bottom:40px;">`;
            state.dataRows.forEach((row, rIdx) => {
                const isLast = rIdx === state.dataRows.length - 1;
                const rowStyle = (isLast && state.dataRows.length > 1) ? 'margin-top:auto;' : '';

                html += `<div style="${rowStyle}">`;
                html += `<h3 style="color:${titleColor}; margin: 30px 0 20px 80px; font-size:26px;">${row.title}</h3>`;
                html += `<div style="overflow:hidden; width:100%; position:relative;">`;
                html += `<div id="search-row-${rIdx}" style="display:flex; gap:30px; transition: transform 0.3s ease; padding: 10px 80px;">`;
                
                row.data.forEach((item, cIdx) => {
                    if (row.type === 'live') {
                        let thumb = App.utils.getSafeThumb(item.thumbnail_url, 'stream');
                        const viewers = App.utils.formatViewers(item.viewer_count);
                        html += `
                            <div id="search-card-${rIdx}-${cIdx}" class="channel-card follow-card" style="flex-shrink:0;">
                                <div class="badge-live">LIVE</div>
                                <div class="badge-viewers">${viewers}</div>
                                <img src="${thumb}" loading="lazy" onerror="this.src='icon.png'" style="width:100%; height:100%; object-fit:cover;">
                                <div class="card-info">
                                    <div style="font-size:22px; font-weight:bold; color:white;">${item.user_name}</div>
                                    <div style="font-size:16px; color:#adadb8; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.title}</div>
                                </div>
                            </div>`;
                    } else if (row.type === 'category') {
                        const box = item.box_art_url || '';
                        let highResBox = App.utils.getSafeThumb(box, 'category');
                        html += `
                            <div class="category-card" id="search-card-${rIdx}-${cIdx}" style="flex-shrink:0; width:200px; height:266px;">
                                <img src="${highResBox}" loading="lazy" onerror="this.src='icon.png'" style="width:100%; height:100%; border-radius:10px; object-fit:cover;">
                                <div style="margin-top:10px; font-weight:bold; color:${titleColor}; text-align:center;">${item.name}</div>
                            </div>`;
                    } else if (row.type === 'channel') {
                        const thumb = item.thumbnail_url || '';
                        const highResThumb = App.utils.getSafeThumb(thumb, 'avatar');
                        html += `
                            <div class="search-channel-card" id="search-card-${rIdx}-${cIdx}" style="flex-shrink:0; width:350px;">
                                <img src="${highResThumb}" loading="lazy" onerror="this.src='icon.png'" class="search-avatar">
                                <div class="search-info">
                                    <div class="search-name">${item.display_name}</div>
                                    <div class="search-game">${item.game_name || 'Offline'}</div>
                                </div>
                            </div>`;
                    }
                });
                html += `</div></div></div>`;
            });
            html += `</div>`;
            resultsArea.innerHTML = html;
            this.updateSelection();
        },

        updateSelection: function() {
            document.querySelectorAll('#search-results-area .selected').forEach(el => el.classList.remove('selected'));

            if (state.activeRow >= 0 && state.activeCol >= 0) {
                const activeCard = document.getElementById(`search-card-${state.activeRow}-${state.activeCol}`);
                if (activeCard) {
                    activeCard.classList.add('selected');

                    const rowDiv = document.getElementById(`search-row-${state.activeRow}`);
                    if (rowDiv) {
                        let cardWidth = activeCard.offsetWidth + 30; // 30 is gap
                        let offset = - (state.activeCol * cardWidth);
                        rowDiv.style.transform = `translateX(${offset}px)`;
                        
                        // Scroll the row container into view vertically, not the card, to avoid horizontal scrolling conflicts
                        rowDiv.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }
        },

        onMenuExit: function() {
            // When user goes down from menu
            state.isInputFocused = true;
            App.nav.inMenu = false;
            this.updateInputUI();
        },

        handleKey: function(e) {
            if (state.isInputFocused) {
                if (e.keyCode === 13) {
                    // "Done" on virtual keyboard
                    e.preventDefault();
                    document.getElementById('search-input').blur();
                    document.body.focus();
                    if (state.dataRows.length > 0) {
                        state.isInputFocused = false;
                        state.activeRow = 0;
                        state.activeCol = 0;
                        this.updateInputUI();
                        this.updateSelection();
                    }
                    return;
                }
                if (e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
                    e.preventDefault();
                    const input = document.getElementById('search-input');
                    if (document.activeElement === input) {
                        input.blur();
                        document.body.focus();
                    } else {
                        state.isInputFocused = false;
                        App.nav.inMenu = true;
                        App.nav.update();
                        this.updateInputUI();
                    }
                    return;
                }
                if (e.keyCode === 38) {
                    e.preventDefault();
                    state.isInputFocused = false;
                    App.nav.inMenu = true;
                    App.nav.update();
                    this.updateInputUI();
                    return;
                }
                if (e.keyCode === 40 && state.dataRows.length > 0) {
                    e.preventDefault();
                    state.isInputFocused = false;
                    state.activeRow = 0;
                    state.activeCol = 0;
                    this.updateInputUI();
                    this.updateSelection();
                    return;
                }
                if (e.keyCode === 37 || e.keyCode === 39) {
                    e.stopPropagation(); 
                    return;
                }
                return;
            }

            // Results Navigation
            if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
                state.isInputFocused = true;
                state.activeRow = -1;
                this.updateInputUI();
                this.updateSelection();
                return;
            }

            if (state.dataRows.length === 0 || state.activeRow < 0) {
                if (e.keyCode === 38) {
                    state.isInputFocused = true;
                    this.updateInputUI();
                }
                return;
            }

            const currentRow = state.dataRows[state.activeRow];
            if (e.keyCode === 39) {
                if (state.activeCol < currentRow.data.length - 1) { 
                    state.activeCol++; 
                    state.colIndices[state.activeRow] = state.activeCol;
                    this.updateSelection(); 
                }
            } else if (e.keyCode === 37) {
                if (state.activeCol > 0) { 
                    state.activeCol--; 
                    state.colIndices[state.activeRow] = state.activeCol;
                    this.updateSelection(); 
                }
            } else if (e.keyCode === 40) {
                if (state.activeRow < state.dataRows.length - 1) {
                    state.activeRow++;
                    state.activeCol = state.colIndices[state.activeRow] || 0;
                    if (state.activeCol >= state.dataRows[state.activeRow].data.length) {
                        state.activeCol = state.dataRows[state.activeRow].data.length - 1;
                    }
                    this.updateSelection();
                }
            } else if (e.keyCode === 38) {
                if (state.activeRow > 0) {
                    state.activeRow--;
                    state.activeCol = state.colIndices[state.activeRow] || 0;
                    if (state.activeCol >= state.dataRows[state.activeRow].data.length) {
                        state.activeCol = state.dataRows[state.activeRow].data.length - 1;
                    }
                    this.updateSelection();
                } else {
                    state.isInputFocused = true;
                    state.activeRow = -1;
                    this.updateSelection();
                    this.updateInputUI();
                }
            } else if (e.keyCode === 13) {
                const item = currentRow.data[state.activeCol];
                if (currentRow.type === 'category') {
                    App.nav.navigateTo('category').then(() => {
                        if (App.modules.category && App.modules.category.open) {
                            App.modules.category.open(item);
                        }
                    });
                } else if (currentRow.type === 'channel') {
                    const login = item.broadcaster_login || item.user_login || item.display_name || item.login;
                    App.nav.navigateTo('channel').then(() => {
                        if (App.modules.channel && App.modules.channel.openChannelView) {
                            App.modules.channel.openChannelView(login);
                        }
                    });
                } else {
                    // Type 'live'
                    const login = item.broadcaster_login || item.user_login || item.display_name || item.user_name;
                    App.nav.navigateTo('player').then(() => {
                        if (App.modules.player && App.modules.player.openNativePlayer) {
                            App.modules.player.openNativePlayer(login, item.id || '', item.title || '');
                        }
                    });
                }
            }
        },

        destroy: function() {
            state.searchSequence++;
            const searchInput = document.getElementById('search-input');
            if (searchInput && searchInput._searchHandler) {
                searchInput.removeEventListener('input', searchInput._searchHandler);
                searchInput._searchHandler = null;
            }
            const viewArea = document.getElementById('main-view-area');
            if (viewArea) {
                const images = viewArea.querySelectorAll('img');
                images.forEach(img => img.src = '');
                viewArea.innerHTML = '';
            }
            
            // Clean UI
            const searchDropdown = document.getElementById('search-dropdown');
            if (searchDropdown) searchDropdown.classList.remove('search-open');
            if (searchInput) {
                searchInput.classList.remove('search-focused');
                searchInput.disabled = true;
            }
        }
    };
})();