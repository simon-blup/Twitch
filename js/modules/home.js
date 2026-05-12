(function() {
    let state = {
        dataRows: [],
        activeRow: 0,
        colIndices: [],
        originalHeroCount: 0,
        seqId: 0
    };

    App.modules.home = {
        init: function() {
            state = {
                dataRows: [],
                activeRow: 0,
                colIndices: [],
                originalHeroCount: 0,
                seqId: Date.now()
            };
        },

        load: async function(isRestore) {
            if (isRestore && state.dataRows.length > 0) {
                this.render();
                return;
            }
            
            const mySeq = state.seqId;
            try {
                // 1. Recommended (Hero)
                const recRes = await App.api.twitchFetch('https://api.twitch.tv/helix/streams?first=10', {}, 60);
                if (recRes.data && recRes.data.length > 0) {
                    state.originalHeroCount = recRes.data.length;
                    const loopedData = [...recRes.data, ...recRes.data, ...recRes.data];
                    state.dataRows.push({ title: "", type: "stream", data: loopedData, isHero: true });
                }

                // 2. Followed Channels
                if (!App.settings.performanceMode) {
                    if (App.auth.userId && App.auth.token) {
                        const folRes = await App.api.twitchFetch(`https://api.twitch.tv/helix/streams/followed?user_id=${App.auth.userId}&first=10`, {}, 30);
                        if (folRes.data && folRes.data.length > 0) {
                            state.dataRows.push({ title: App.t('live_recom'), type: 'stream', data: folRes.data });
                        } else {
                            state.dataRows.push({ title: App.t('followed_channels'), type: 'stream', data: [] });
                        }
                    }
                }

                // 3. Top Categories
                const catRes = await App.api.twitchFetch('https://api.twitch.tv/helix/games/top?first=10', {}, 120);
                if (catRes.data && catRes.data.length > 0) {
                    state.dataRows.push({ title: App.t('top_cats'), type: 'category', data: catRes.data });
                }

                if (mySeq !== state.seqId) return;

                state.colIndices = new Array(state.dataRows.length).fill(0);
                if (state.dataRows[0] && state.dataRows[0].isHero) {
                    state.colIndices[0] = state.originalHeroCount;
                }
                this.render();
            } catch (e) {
                if (mySeq !== state.seqId) return;
                console.error("Home API Error", e);
                const va = document.getElementById('main-view-area');
                if (va) va.innerHTML = `<div style="color:red; text-align:center; padding-top:100px;">${App.t('loading_error')}</div>`;
            }
        },

        render: function() {
            const viewArea = document.getElementById('main-view-area');
            if (!viewArea) return;
            const isLight = document.body.classList.contains('theme-light');
            const titleColor = isLight ? '#000' : 'white';

            let html = '<div id="home-view" style="padding-bottom:60px;">';
            state.dataRows.forEach((row, rowIndex) => {
                if (row.title) {
                    html += `<h3 style="color:${titleColor}; margin-left:80px; margin-bottom:30px; font-size:26px;">${row.title}</h3>`;
                }
                const gridClass = row.isHero ? 'channel-grid hero-grid' : 'channel-grid';
                const wrapperStyle = 'width:100%; overflow:visible; perspective:1200px; margin-bottom:40px;';
                html += `
                    <div style="${wrapperStyle}">
                        <div id="row-${rowIndex}" class="${gridClass}"></div>
                    </div>
                `;
            });
            html += '</div>';
            viewArea.innerHTML = html;

            state.dataRows.forEach((row, rowIndex) => {
                const rowDiv = document.getElementById(`row-${rowIndex}`);
                if (!rowDiv) return;

                if (row.type === 'category') {
                    row.data.forEach((item) => {
                        const card = document.createElement('div');
                        card.className = 'category-card';
                        let thumb = App.utils.getSafeThumb(item.box_art_url, 'category');

                        card.innerHTML = `
                            <img src="${thumb}" loading="lazy" onerror="this.src='icon.png'" style="width:100%; height:100%; object-fit:cover;">
                            <div class="card-info"><div style="font-size:20px; font-weight:bold; color:white;">${item.name}</div></div>`;
                        rowDiv.appendChild(card);
                    });
                } else if (row.type === 'stream') {
                    row.data.forEach((item) => {
                        const card = document.createElement('div');
                        card.className = row.isHero ? 'channel-card hero-card' : 'channel-card';
                        let thumb = App.utils.getSafeThumb(item.thumbnail_url, 'stream');
                        const viewers = App.utils.formatViewers(item.viewer_count);
                        card.innerHTML = `
                            <div class="badge-live">${App.t('live_badge')}</div>
                            <div class="badge-viewers">${viewers}</div>
                            <img src="${thumb}" loading="lazy" onerror="this.src='icon.png'" style="width:100%; height:100%; object-fit:cover;">
                            <div class="card-info">
                                <div style="font-size:${row.isHero ? '28' : '22'}px; font-weight:bold; color:white;">${item.user_name}</div>
                                <div style="font-size:${row.isHero ? '18' : '16'}px; color:#adadb8; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.title}</div>
                            </div>`;
                        rowDiv.appendChild(card);
                    });
                }
            });

            // Prevent transitions on first render
            state.dataRows.forEach((row, rowIndex) => {
                const rowDiv = document.getElementById(`row-${rowIndex}`);
                if (!rowDiv) return;
                rowDiv.style.transition = 'none';
                const cards = rowDiv.querySelectorAll('.channel-card, .category-card');
                cards.forEach(c => c.style.transition = 'none');
            });

            this.updateSelection();

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    state.dataRows.forEach((row, rowIndex) => {
                        const rowDiv = document.getElementById(`row-${rowIndex}`);
                        if (!rowDiv) return;
                        rowDiv.style.transition = '';
                        const cards = rowDiv.querySelectorAll('.channel-card, .category-card');
                        cards.forEach(c => c.style.transition = '');
                    });
                });
            });
        },

        updateSelection: function() {
            const centerX = window.innerWidth / 2;
            const gap = 20;

            state.dataRows.forEach((row, rowIndex) => {
                const rowDiv = document.getElementById(`row-${rowIndex}`);
                if (!rowDiv) return;

                const currentColIdx = state.colIndices[rowIndex];
                const isActiveRow = !App.nav.inMenu && state.activeRow === rowIndex;

                const cards = rowDiv.querySelectorAll(row.type === 'category' ? '.category-card' : '.channel-card');

                cards.forEach((c, i) => {
                    c.classList.remove('selected', 'hero-adjacent', 'hero-center');
                    if (row.isHero) {
                        if (i === currentColIdx) {
                            c.classList.add('hero-center');
                            if (isActiveRow) c.classList.add('selected');
                        }
                        else if (i === currentColIdx - 1 || i === currentColIdx + 1) {
                            c.classList.add('hero-adjacent');
                        }
                    } else {
                        c.classList.toggle('selected', isActiveRow && i === currentColIdx);
                    }
                });

                if (cards.length > 0) {
                    let cardWidth, offset;
                    if (row.isHero) {
                        cardWidth = 800 + gap;
                        offset = centerX - 400 - (currentColIdx * cardWidth);
                    } else if (row.type === 'stream') {
                        cardWidth = 600 + gap;
                        offset = 80 - (currentColIdx * cardWidth);
                    } else if (row.type === 'category') {
                        cardWidth = 300 + gap;
                        offset = 80 - (currentColIdx * cardWidth);
                    }
                    rowDiv.style.transform = `translateX(${offset}px)`;
                }
            });

            if (!App.nav.inMenu) {
                const rowEl = document.getElementById(`row-${state.activeRow}`);
                if (rowEl && rowEl.parentElement) {
                    rowEl.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
            if (!currentRowData) return;
            const currentLen = currentRowData.data.length;

            if (e.keyCode === 39) { // Right
                state.colIndices[state.activeRow]++;
                if (currentRowData.isHero) {
                    this.updateSelection();
                    if (state.colIndices[state.activeRow] >= state.originalHeroCount * 2) {
                        setTimeout(() => {
                            if (state.colIndices[state.activeRow] >= state.originalHeroCount * 2) {
                                const rowDiv = document.getElementById(`row-${state.activeRow}`);
                                if (rowDiv) {
                                    const cards = rowDiv.querySelectorAll('.channel-card');
                                    rowDiv.style.transition = 'none';
                                    cards.forEach(c => c.style.transition = 'none');
                                    state.colIndices[state.activeRow] -= state.originalHeroCount;
                                    this.updateSelection();
                                    rowDiv.offsetHeight; // force reflow
                                    rowDiv.style.transition = '';
                                    cards.forEach(c => c.style.transition = '');
                                }
                            }
                        }, 750);
                    }
                } else if (state.colIndices[state.activeRow] >= currentLen) {
                    state.colIndices[state.activeRow] = currentLen - 1;
                    this.updateSelection();
                } else { this.updateSelection(); }
            }
            if (e.keyCode === 37) { // Left
                state.colIndices[state.activeRow]--;
                if (currentRowData.isHero) {
                    if (state.colIndices[state.activeRow] < 0) state.colIndices[state.activeRow] = 0;
                    this.updateSelection();
                    if (state.colIndices[state.activeRow] < state.originalHeroCount) {
                        setTimeout(() => {
                            if (state.colIndices[state.activeRow] < state.originalHeroCount) {
                                const rowDiv = document.getElementById(`row-${state.activeRow}`);
                                if (rowDiv) {
                                    const cards = rowDiv.querySelectorAll('.channel-card');
                                    rowDiv.style.transition = 'none';
                                    cards.forEach(c => c.style.transition = 'none');
                                    state.colIndices[state.activeRow] += state.originalHeroCount;
                                    this.updateSelection();
                                    rowDiv.offsetHeight; // force reflow
                                    rowDiv.style.transition = '';
                                    cards.forEach(c => c.style.transition = '');
                                }
                            }
                        }, 750);
                    }
                } else if (state.colIndices[state.activeRow] < 0) {
                    state.colIndices[state.activeRow] = 0;
                    this.updateSelection();
                } else { this.updateSelection(); }
            }
            if (e.keyCode === 40 && state.activeRow < state.dataRows.length - 1) { 
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
            if (e.keyCode === 13) { // Enter
                if (currentRowData.type === 'category') {
                    const selectedCategory = currentRowData.data[state.colIndices[state.activeRow]];
                    App.nav.navigateTo('category').then(() => {
                        if (App.modules.category && App.modules.category.open) {
                            App.modules.category.open(selectedCategory);
                        }
                    });
                } else if (currentRowData.type === 'stream') {
                    const selectedStream = currentRowData.data[state.colIndices[state.activeRow]];
                    App.nav.navigateTo('player').then(() => {
                        if (App.modules.player && App.modules.player.openNativePlayer) {
                            App.modules.player.openNativePlayer(selectedStream.user_login || selectedStream.user_name, selectedStream.user_id, selectedStream.title);
                        }
                    });
                }
            }
            if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
                // Return -> we should show exit menu, but for now we let it go to menu or implement exit menu logic in core
                App.nav.inMenu = true;
                App.nav.update();
                this.updateSelection();
            }
        },

        destroy: function() {
            state.seqId++; // invalidate pending fetches
            const viewArea = document.getElementById('main-view-area');
            if (viewArea) {
                const images = viewArea.querySelectorAll('img');
                images.forEach(img => img.src = '');
                viewArea.innerHTML = '';
            }
        }
    };
})();