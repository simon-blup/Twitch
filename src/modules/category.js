(function() {
    var state = {
        categoryData: null,
        streams: [],
        clips: [],
        activeSection: 1, 
        streamCol: 0,
        clipCol: 0,
        seqId: 0,
        visibleStreams: 6,
        visibleClips: 6
    };

    App.modules.category = {
        init: function() {},

        load: function(isRestore) {
            if (isRestore && (state.streams.length > 0 || state.clips.length > 0)) {
                this.render();
            }
            return Promise.resolve();
        },

        open: function(categoryObj) {
            var self = this;
            state.categoryData = categoryObj;
            state.seqId = Date.now();
            state.activeSection = 1; 
            state.streamCol = 0;
            state.clipCol = 0;
            state.streams = [];
            state.clips = [];
            state.visibleStreams = 6;
            state.visibleClips = 6;
            
            this.renderLoading();
            return Promise.all([
                this.fetchStreams(),
                this.fetchClips()
            ]).then(function() {
                if (state.streams.length === 0 && state.clips.length > 0) {
                    state.activeSection = 3;
                } else if (state.streams.length === 0 && state.clips.length === 0) {
                    state.activeSection = 1;
                }
                self.render();
            });
        },

        fetchStreams: function() {
            var self = this;
            var mySeq = state.seqId;
            var allStreams = [];
            
            function fetchPage(cursor, pageCount) {
                var url = 'https://api.twitch.tv/helix/streams?game_id=' + state.categoryData.id + '&first=100';
                if (cursor) {
                    url += '&after=' + cursor;
                }
                return App.api.twitchFetch(url, {}, 60).then(function(res) {
                    if (mySeq !== state.seqId) return;
                    var data = res.data || [];
                    allStreams = allStreams.concat(data);
                    
                    var pageCursor = res.pagination && res.pagination.cursor;
                    if (pageCursor && pageCount < 3 && data.length === 100) {
                        return fetchPage(pageCursor, pageCount + 1);
                    }
                });
            }

            return fetchPage(null, 1).then(function() {
                if (mySeq !== state.seqId) return;
                state.streams = allStreams;
            }).catch(function(e) { console.error("Fetch Streams Error", e); });
        },

        fetchClips: function() {
            var mySeq = state.seqId;
            var days = 30;
            var startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
            
            return App.api.twitchFetch('https://api.twitch.tv/helix/clips?game_id=' + state.categoryData.id + '&started_at=' + startDate + '&first=40', {}, 300)
                .then(function(res) {
                    if (mySeq !== state.seqId) return;
                    state.clips = res.data || [];
                }).catch(function(e) { console.error("Fetch Clips Error", e); });
        },

        renderLoading: function() {
            var viewArea = document.getElementById('main-view-area');
            if (viewArea) {
                viewArea.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; height:100vh; font-size:24px; color:#adadb8;">' + App.t('loading') + '</div>';
            }
        },

        render: function() {
            var viewArea = document.getElementById('main-view-area');
            if (!viewArea) return;

            var totalViewers = state.streams.reduce(function(acc, s) { return acc + s.viewer_count; }, 0);
            var boxArt = App.utils.getSafeThumb(state.categoryData.box_art_url, 'category');
            var plusSign = (state.streams.length >= 300) ? '+' : '';
            var isLight = document.body.classList.contains('theme-light');
            var titleColor = isLight ? '#000' : 'white';

            var bannerHtml = boxArt ? '<div class="channel-background">' +
                    '<div class="channel-background-image" style="background-image: url(\'' + boxArt + '\');"></div>' +
                    '<div class="channel-background-gradient"></div>' +
                '</div>' : '';

            var html = '<div id="category-view">' +
                    bannerHtml +
                    '<div class="category-header-container">' +
                        '<img class="category-boxart" src="' + boxArt + '" onerror="this.src=\'icon.png\'">' +
                        '<div class="category-info-content">' +
                            '<h1 class="category-name" style="color:' + titleColor + ';">' + state.categoryData.name + '</h1>' +
                            '<div class="category-viewers">' +
                                plusSign + App.utils.formatViewers(totalViewers) + ' ' + App.t('viewers') +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div id="section-1" class="category-bottom-section">' +
                        '<div style="width: 100%; overflow: visible;">' +
                            '<div id="cat-streams-strip" style="display:flex; flex-wrap:wrap; flex-direction:row; padding: 10px 80px; box-sizing:border-box;">' +
                                this.renderStreamItems() +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div id="section-3" class="category-bottom-section" style="' + (state.clips.length === 0 ? 'display:none;' : '') + '">' +
                        '<div style="width: 100%; overflow: visible;">' +
                            '<div id="cat-clips-strip" style="display:flex; flex-wrap:wrap; flex-direction:row; padding: 10px 80px; box-sizing:border-box;">' +
                                this.renderClipItems() +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            
            viewArea.innerHTML = html;
            this.updateSelection();
        },

        renderStreamItems: function() {
            if (state.streams.length === 0) return '<div style="color:#adadb8; font-size:20px;">Nessun canale live trovato.</div>';
            return state.streams.slice(0, state.visibleStreams).map(function(s, i) {
                var thumb = App.utils.getSafeThumb(s.thumbnail_url, 'stream');
                return '<div id="cat-item-1-' + i + '" class="channel-card" style="width:560px; margin-right:20px; flex-shrink:0;">' +
                        '<div class="badge-live">LIVE</div>' +
                        '<div class="badge-viewers">' + App.utils.formatViewers(s.viewer_count) + '</div>' +
                        '<img src="' + thumb + '" style="width:100%; height:100%; object-fit:cover;">' +
                        '<div class="card-info">' +
                            '<div style="font-size:14px; font-weight:bold; color:white;">' + s.user_name + '</div>' +
                            '<div style="font-size:11px; color:#adadb8; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + s.title + '</div>' +
                        '</div>' +
                    '</div>';
            }).join('');
        },

        renderClipItems: function() {
            if (state.clips.length === 0) return '<div style="color:#adadb8; font-size:20px;">Nessuna clip trovata.</div>';
            return state.clips.slice(0, state.visibleClips).map(function(c, i) {
                var thumb = c.thumbnail_url;
                return '<div id="cat-item-3-' + i + '" class="channel-card" style="width:560px; margin-right:20px; flex-shrink:0;">' +
                        '<div class="badge-viewers no-dot" style="top:20px; right:20px; bottom:auto; left:auto;">' + App.utils.formatViewers(c.view_count) + ' views</div>' +
                        '<img src="' + thumb + '" style="width:100%; height:100%; object-fit:cover;">' +
                        '<div class="card-info">' +
                            '<div style="font-size:14px; font-weight:bold; color:white;">' + c.title + '</div>' +
                            '<div style="font-size:11px; color:#adadb8; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + c.creator_name + '</div>' +
                        '</div>' +
                    '</div>';
            }).join('');
        },

        updateSelection: function() {
            var cards = document.querySelectorAll('.channel-card');
            for (var i = 0; i < cards.length; i++) cards[i].classList.remove('selected');

            if (state.activeSection === 1) {
                var item = document.getElementById('cat-item-1-' + state.streamCol);
                if (item && !App.nav.inMenu) {
                    item.classList.add('selected');
                    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else if (state.activeSection === 3) {
                var item = document.getElementById('cat-item-3-' + state.clipCol);
                if (item && !App.nav.inMenu) {
                    item.classList.add('selected');
                    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }

            if (App.nav.inMenu) window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        handleKey: function(e) {
            var self = this;
            if (e.keyCode === 39) { 
                if (state.activeSection === 1) {
                    if (state.streamCol % 3 < 2 && state.streamCol < state.streams.length - 1) {
                        state.streamCol++;
                        if (state.streamCol >= state.visibleStreams - 2) {
                            state.visibleStreams += 6;
                            document.getElementById('cat-streams-strip').innerHTML = this.renderStreamItems();
                        }
                    }
                } else if (state.activeSection === 3) {
                    if (state.clipCol % 3 < 2 && state.clipCol < state.clips.length - 1) {
                        state.clipCol++;
                        if (state.clipCol >= state.visibleClips - 2) {
                            state.visibleClips += 6;
                            document.getElementById('cat-clips-strip').innerHTML = this.renderClipItems();
                        }
                    }
                }
            } else if (e.keyCode === 37) { 
                if (state.activeSection === 1) {
                    if (state.streamCol % 3 > 0) {
                        state.streamCol--;
                    }
                } else if (state.activeSection === 3) {
                    if (state.clipCol % 3 > 0) {
                        state.clipCol--;
                    }
                }
            } else if (e.keyCode === 40) { 
                if (state.activeSection === 1) {
                    if (state.streamCol + 3 < state.streams.length) {
                        state.streamCol += 3;
                        if (state.streamCol >= state.visibleStreams - 3) {
                            state.visibleStreams += 6;
                            document.getElementById('cat-streams-strip').innerHTML = this.renderStreamItems();
                        }
                    } else if (state.clips.length > 0) {
                        state.activeSection = 3;
                        state.clipCol = Math.min(state.streamCol % 3, state.clips.length - 1);
                    }
                } else if (state.activeSection === 3) {
                    if (state.clipCol + 3 < state.clips.length) {
                        state.clipCol += 3;
                        if (state.clipCol >= state.visibleClips - 3) {
                            state.visibleClips += 6;
                            document.getElementById('cat-clips-strip').innerHTML = this.renderClipItems();
                        }
                    }
                }
            } else if (e.keyCode === 38) { 
                if (state.activeSection === 1) {
                    if (state.streamCol >= 3) {
                        state.streamCol -= 3;
                    } else {
                        App.nav.inMenu = true;
                        App.nav.update();
                    }
                } else if (state.activeSection === 3) {
                    if (state.clipCol >= 3) {
                        state.clipCol -= 3;
                    } else if (state.streams.length > 0) {
                        state.activeSection = 1;
                        var lastRowStart = Math.floor((state.streams.length - 1) / 3) * 3;
                        state.streamCol = Math.min(lastRowStart + (state.clipCol % 3), state.streams.length - 1);
                    } else {
                        App.nav.inMenu = true;
                        App.nav.update();
                    }
                }
            } else if (e.keyCode === 13) { 
                if (state.activeSection === 1) {
                    var s = state.streams[state.streamCol];
                    App.nav.navigateTo('player').then(function() {
                        App.modules.player.openNativePlayer(s.user_login || s.user_name, s.user_id, s.title);
                    });
                } else if (state.activeSection === 3) {
                    var c = state.clips[state.clipCol];
                    App.nav.navigateTo('player').then(function() {
                        App.modules.player.openNativePlayer(c.broadcaster_name, c.broadcaster_id, c.title, c);
                    });
                }
            } else if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
                this.goBack();
                return;
            }
            this.updateSelection();
        },

        goBack: function() {
            App.nav.inMenu = false;
            var prevModule = App.nav.menuMap[App.nav.focusIndex] || 'home';
            App.nav.navigateTo(prevModule);
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