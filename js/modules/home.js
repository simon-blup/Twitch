(function() {
    var state = {
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

        load: function(isRestore) {
            var self = this;
            if (isRestore && state.dataRows.length > 0) {
                this.render();
                return Promise.resolve();
            }
            
            var mySeq = state.seqId;
            return App.api.twitchFetch('https://api.twitch.tv/helix/streams?first=10', {}, 60)
                .then(function(recRes) {
                    if (recRes.data && recRes.data.length > 0) {
                        state.dataRows.push({ title: '', type: "hero", data: recRes.data });
                    }

                    if (!App.settings.performanceMode) {
                        if (App.auth.userId && App.auth.token) {
                            return App.api.twitchFetch('https://api.twitch.tv/helix/streams/followed?user_id=' + App.auth.userId + '&first=10', {}, 30)
                                .then(function(folRes) {
                                    if (folRes.data && folRes.data.length > 0) {
                                        state.dataRows.push({ title: App.t('followed_channels'), type: 'stream', data: folRes.data });
                                    }
                                });
                        }
                    }
                })
                .then(function() {
                    return App.api.twitchFetch('https://api.twitch.tv/helix/games/top?first=10', {}, 120);
                })
                .then(function(catRes) {
                    if (catRes.data && catRes.data.length > 0) {
                        state.dataRows.push({ title: App.t('top_cats'), type: 'category', data: catRes.data });
                    }

                    if (mySeq !== state.seqId) return;

                    state.colIndices = [];
                    for (var i = 0; i < state.dataRows.length; i++) {
                        state.colIndices[i] = 0;
                    }
                    self.render();
                })
                .catch(function(e) {
                    if (mySeq !== state.seqId) return;
                    console.error("Home API Error", e);
                    var va = document.getElementById('main-view-area');
                    if (va) va.innerHTML = '<div style="color:red; text-align:center; padding-top:100px;">' + App.t('loading_error') + '</div>';
                });
        },

        render: function() {
            var viewArea = document.getElementById('main-view-area');
            if (!viewArea) return;
            var isLight = document.body.classList.contains('theme-light');
            var titleColor = isLight ? '#000' : 'white';

            var html = '<div id="home-view" style="padding-bottom:60px;">';
            state.dataRows.forEach(function(row, rowIndex) {
                if (row.type === 'hero') {
                    // No title for hero row
                    var wrapperStyle = 'width:100%; overflow:visible; margin-bottom:40px; height:500px; position:relative;';
                    html += '<div style="' + wrapperStyle + '"><div id="row-' + rowIndex + '" class="channel-grid hero-grid"></div></div>';
                } else {
                    if (row.title) {
                        html += '<h3 style="color:' + titleColor + '; margin-left:80px; margin-bottom:30px; font-size:26px;">' + row.title + '</h3>';
                    }
                    var wrapperStyle = 'width:100%; overflow:visible; margin-bottom:40px;';
                    html += '<div style="' + wrapperStyle + '"><div id="row-' + rowIndex + '" class="channel-grid"></div></div>';
                }
            });
            html += '</div>';
            viewArea.innerHTML = html;

            state.dataRows.forEach(function(row, rowIndex) {
                var rowDiv = document.getElementById('row-' + rowIndex);
                if (!rowDiv) return;

                if (row.type === 'category') {
                    row.data.forEach(function(item) {
                        var card = document.createElement('div');
                        card.className = 'category-card';
                        var thumb = App.utils.getSafeThumb(item.box_art_url, 'category');

                        card.innerHTML = '<img src="' + thumb + '" loading="lazy" onerror="this.src=\'icon.png\'" style="width:100%; height:100%; object-fit:cover;">' +
                            '<div class="card-info"><div style="font-size:20px; font-weight:bold; color:white;">' + item.name + '</div></div>';
                        rowDiv.appendChild(card);
                    });
                } else if (row.type === 'hero') {
                    row.data.forEach(function(item) {
                        var card = document.createElement('div');
                        card.className = 'hero-card';
                        var thumb = App.utils.getSafeThumb(item.thumbnail_url, 'stream');
                        var viewers = App.utils.formatViewers(item.viewer_count);
                        card.innerHTML = '<div class="badge-live">' + App.t('live_badge') + '</div>' +
                            '<div class="badge-viewers">' + viewers + '</div>' +
                            '<img src="' + thumb + '" loading="lazy" onerror="this.src=\'icon.png\'" style="width:100%; height:100%; object-fit:cover; border-radius:20px;">' +
                            '<div class="card-info">' +
                                '<div style="font-size:24px; font-weight:bold; color:white;">' + item.user_name + '</div>' +
                                '<div style="font-size:16px; color:#adadb8; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + item.title + '</div>' +
                            '</div>';
                        rowDiv.appendChild(card);
                    });
                } else if (row.type === 'stream') {
                    row.data.forEach(function(item) {
                        var card = document.createElement('div');
                        card.className = 'channel-card';
                        var thumb = App.utils.getSafeThumb(item.thumbnail_url, 'stream');
                        var viewers = App.utils.formatViewers(item.viewer_count);
                        card.innerHTML = '<div class="badge-live">' + App.t('live_badge') + '</div>' +
                            '<div class="badge-viewers">' + viewers + '</div>' +
                            '<img src="' + thumb + '" loading="lazy" onerror="this.src=\'icon.png\'" style="width:100%; height:100%; object-fit:cover;">' +
                            '<div class="card-info">' +
                                '<div style="font-size:22px; font-weight:bold; color:white;">' + item.user_name + '</div>' +
                                '<div style="font-size:16px; color:#adadb8; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + item.title + '</div>' +
                            '</div>';
                        rowDiv.appendChild(card);
                    });
                }
            });

            state.dataRows.forEach(function(row, rowIndex) {
                var rowDiv = document.getElementById('row-' + rowIndex);
                if (!rowDiv) return;
                rowDiv.style.transition = 'none';
                var cards = rowDiv.querySelectorAll('.channel-card, .category-card, .hero-card');
                for (var i = 0; i < cards.length; i++) cards[i].style.transition = 'none';
            });

            this.updateSelection();

            setTimeout(function() {
                state.dataRows.forEach(function(row, rowIndex) {
                    var rowDiv = document.getElementById('row-' + rowIndex);
                    if (!rowDiv) return;
                    rowDiv.style.transition = '';
                    var cards = rowDiv.querySelectorAll('.channel-card, .category-card, .hero-card');
                    for (var i = 0; i < cards.length; i++) cards[i].style.transition = '';
                });
            }, 100);
        },

        updateSelection: function() {
            var self = this;
            var rows = state.dataRows;
            rows.forEach(function(row, rowIndex) {
                var rowDiv = document.getElementById('row-' + rowIndex);
                if (!rowDiv) return;

                var cards = rowDiv.querySelectorAll('.channel-card, .category-card, .hero-card');
                var activeCol = state.colIndices[rowIndex];

                if (row.type === 'hero') {
                    // Hero carousel: center the active card, make it bigger
                    var heroW = 700;
                    var heroGap = 20;
                    var screenW = 1920;
                    // Center the active card on screen
                    var offset = Math.round((screenW / 2) - (heroW / 2) - (activeCol * (heroW + heroGap)));
                    rowDiv.style.transform = 'translateX(' + offset + 'px)';

                    for (var i = 0; i < cards.length; i++) {
                        var card = cards[i];
                        var isActive = (rowIndex === state.activeRow && i === activeCol && !App.nav.inMenu);
                        var dist = Math.abs(i - activeCol);
                        
                        card.classList.remove('selected', 'hero-center', 'hero-adjacent');
                        
                        if (isActive) {
                            card.classList.add('selected');
                        } else if (dist === 0) {
                            card.classList.add('hero-center');
                        } else if (dist === 1) {
                            card.classList.add('hero-adjacent');
                        }
                    }
                } else {
                    for (var i = 0; i < cards.length; i++) {
                        var card = cards[i];
                        var isSelected = (rowIndex === state.activeRow && i === activeCol && !App.nav.inMenu);
                        card.classList.toggle('selected', isSelected);
                    }

                    var cardWidth = row.type === 'category' ? 300 : 600;
                    var gap = 20;
                    var offset = 80 - (activeCol * (cardWidth + gap));
                    if (offset > 80) offset = 80;
                    rowDiv.style.transform = 'translateX(' + offset + 'px)';
                }
            });

            if (App.nav.inMenu) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                var activeRowEl = document.getElementById('row-' + state.activeRow);
                if (activeRowEl) {
                    activeRowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        },

        handleKey: function(e) {
            var self = this;
            var currentRowData = state.dataRows[state.activeRow];
            if (!currentRowData) return;

            if (e.keyCode === 39) { 
                if (state.colIndices[state.activeRow] < currentRowData.data.length - 1) {
                    state.colIndices[state.activeRow]++;
                }
                this.updateSelection();
            }
            if (e.keyCode === 37) { 
                if (state.colIndices[state.activeRow] > 0) {
                    state.colIndices[state.activeRow]--;
                }
                this.updateSelection();
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
            if (e.keyCode === 13) { 
                if (currentRowData.type === 'category') {
                    var selectedCategory = currentRowData.data[state.colIndices[state.activeRow]];
                    App.nav.navigateTo('category').then(function() {
                        if (App.modules.category && App.modules.category.open) {
                            App.modules.category.open(selectedCategory);
                        }
                    });
                } else if (currentRowData.type === 'stream' || currentRowData.type === 'hero') {
                    var selectedStream = currentRowData.data[state.colIndices[state.activeRow]];
                    App.nav.navigateTo('player').then(function() {
                        if (App.modules.player && App.modules.player.openNativePlayer) {
                            App.modules.player.openNativePlayer(selectedStream.user_login || selectedStream.user_name, selectedStream.user_id, selectedStream.title);
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
            var viewArea = document.getElementById('main-view-area');
            if (viewArea) {
                var images = viewArea.querySelectorAll('img');
                for (var i = 0; i < images.length; i++) images[i].src = '';
                viewArea.innerHTML = '';
            }
        }
    };
})();