(function() {
    var state = {
        channelLogin: '',
        channelData: null,
        followerCount: 0,
        isLive: false,
        liveStreamData: null,
        vods: [], 
        clips: [],
        activeSection: 1, 
        vodCol: 0,
        clipCol: 0,
        seqId: 0,
        visibleVods: 6,
        visibleClips: 6
    };

    App.modules.channel = {
        init: function() {},

        load: function(isRestore) {
            if (isRestore && (state.vods.length > 0 || state.clips.length > 0)) {
                this.render();
            }
            return Promise.resolve();
        },

        openChannelView: function(login) {
            App.nav.inMenu = false;
            App.nav.update();
            state.channelLogin = login.toLowerCase();
            state.seqId = Date.now();
            state.activeSection = 1; 
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
            return this.fetchChannelData();
        },

        fetchChannelData: function() {
            var self = this;
            var mySeq = state.seqId;
            return App.api.twitchFetch('https://api.twitch.tv/helix/users?login=' + state.channelLogin)
                .then(function(userRes) {
                    if (mySeq !== state.seqId) return;
                    if (!userRes.data || userRes.data.length === 0) throw new Error("Canale non trovato");
                    state.channelData = userRes.data[0];

                    return App.api.twitchFetch('https://api.twitch.tv/helix/channels/followers?broadcaster_id=' + state.channelData.id)
                        .then(function(folRes) {
                            if (mySeq !== state.seqId) return;
                            state.followerCount = folRes.total || 0;
                        }).catch(function(e) { console.error("Followers fetch error", e); });
                })
                .then(function() {
                    return Promise.all([
                        self.fetchVods(),
                        self.fetchClips()
                    ]);
                })
                .then(function() {
                    if (mySeq !== state.seqId) return;
                    if (state.vods.length === 0 && state.clips.length > 0) state.activeSection = 3;
                    self.render();
                })
                .catch(function(e) {
                    if (mySeq !== state.seqId) return;
                    console.error("Channel Fetch Error", e);
                    var viewArea = document.getElementById('main-view-area');
                    if (viewArea) viewArea.innerHTML = '<div style="color:red; text-align:center; padding-top:100px;">Errore caricamento canale.</div>';
                });
        },

        fetchVods: function() {
            var mySeq = state.seqId;
            return App.api.twitchFetch('https://api.twitch.tv/helix/streams?user_id=' + state.channelData.id)
                .then(function(liveRes) {
                    if (mySeq !== state.seqId) return;
                    var liveArr = [];
                    if (liveRes.data && liveRes.data.length > 0) {
                        state.isLive = true;
                        state.liveStreamData = liveRes.data[0];
                        liveArr.push({
                            isLiveItem: true,
                            id: state.liveStreamData.user_id,
                            title: state.liveStreamData.title,
                            user_name: state.liveStreamData.user_name,
                            view_count: state.liveStreamData.viewer_count,
                            thumbnail_url: state.liveStreamData.thumbnail_url,
                            created_at: state.liveStreamData.started_at,
                            duration: 'LIVE'
                        });
                    }
                    return App.api.twitchFetch('https://api.twitch.tv/helix/videos?user_id=' + state.channelData.id + '&first=50')
                        .then(function(vidRes) {
                            if (mySeq !== state.seqId) return;
                            var rawVods = vidRes.data || [];
                            if (state.isLive && state.liveStreamData) {
                                rawVods = rawVods.filter(function(v) { return v.stream_id !== state.liveStreamData.id; });
                            }
                            var vodArr = rawVods.map(function(v) {
                                return {
                                    isLiveItem: false,
                                    id: v.id,
                                    title: v.title,
                                    user_name: v.user_name,
                                    view_count: v.view_count,
                                    thumbnail_url: v.thumbnail_url,
                                    created_at: v.published_at,
                                    duration: v.duration,
                                    url: v.url
                                };
                            });
                            state.vods = liveArr.concat(vodArr);
                        });
                }).catch(function(e) { console.error("Fetch Vods Error", e); });
        },

        fetchClips: function() {
            var mySeq = state.seqId;
            var days = 30;
            var startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
            return App.api.twitchFetch('https://api.twitch.tv/helix/clips?broadcaster_id=' + state.channelData.id + '&started_at=' + startDate + '&first=50', {}, 300)
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

            var isLight = document.body.classList.contains('theme-light');
            var titleColor = isLight ? '#000' : 'white';
            var banner = state.channelData.offline_image_url || state.channelData.profile_image_url || '';
            var isAvatarFallback = !state.channelData.offline_image_url;
            
            var bannerHtml = banner ? '<div class="channel-background">' +
                    '<div class="channel-background-image" style="background-image: url(\'' + banner + '\');"></div>' +
                    '<div class="channel-background-gradient"></div>' +
                '</div>' : '';

            var html = '<div id="channel-view">' +
                    bannerHtml +
                    '<div class="profile-header-container">' +
                        '<img class="profile-avatar" src="' + state.channelData.profile_image_url + '">' +
                        '<div class="profile-info-content">' +
                            '<h1 class="profile-name" style="color:' + titleColor + ';">' + state.channelData.display_name + '</h1>' +
                            '<div class="profile-meta-row">' +
                                '<span class="profile-followers-count" style="color:' + titleColor + ';">' + App.utils.formatViewers(state.followerCount) + '</span>' +
                                '<span class="profile-followers-label">' + App.t('followers') + '</span>' +
                            '</div>' +
                            '<div class="profile-description">' + (state.channelData.description || 'Nessuna descrizione.') + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div id="section-1" class="channel-bottom-section" style="' + (state.vods.length === 0 ? 'display:none;' : '') + '">' +
                        '<div style="width: 100%; overflow: visible;">' +
                            '<div id="chan-vods-strip" style="display:flex; padding: 10px 80px; transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1); transform: translateX(0px);">' +
                                this.renderVodItems() +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div id="section-3" class="channel-bottom-section" style="' + (state.clips.length === 0 && state.vods.length > 0 ? 'display:none;' : '') + '">' +
                        '<div style="width: 100%; overflow: visible;">' +
                            '<div id="chan-clips-strip" style="display:flex; flex-direction:row; padding: 10px 80px; transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1); transform: translateX(0px);">' +
                                this.renderClipItems() +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            viewArea.innerHTML = html;
            this.updateSelection();
        },

        renderVodItems: function() {
            if (state.vods.length === 0) return '<div style="color:#adadb8; font-size:20px;">Nessun video trovato.</div>';
            return state.vods.slice(0, state.visibleVods).map(function(v, i) {
                var thumb = 'https://vod-secure.twitch.tv/_404/404_processing_600x338.png';
                if (v.thumbnail_url) {
                    thumb = v.thumbnail_url.replace('%{width}', '600').replace('%{height}', '338').replace('{width}', '600').replace('{height}', '338');
                }
                var durationBadge = v.isLiveItem ? '<div class="badge-live">LIVE</div>' : '<div class="badge-live" style="background:rgba(0,0,0,0.8);">' + v.duration + '</div>';
                var viewerBadge = v.isLiveItem ? '<div class="badge-viewers">' + App.utils.formatViewers(v.view_count) + '</div>' : '<div class="badge-viewers no-dot" style="top:20px; right:20px; bottom:auto; left:auto;">' + App.utils.formatViewers(v.view_count) + ' views</div>';

                return '<div id="chan-item-1-' + i + '" class="channel-card" style="width:560px; margin-right:20px; flex-shrink:0;">' +
                        durationBadge + viewerBadge +
                        '<img src="' + thumb + '" onerror="this.src=\'https://vod-secure.twitch.tv/_404/404_processing_600x338.png\'" style="width:100%; height:100%; object-fit:cover;">' +
                        '<div class="card-info">' +
                            '<div style="font-size:22px; font-weight:bold; color:white;">' + v.title + '</div>' +
                            '<div style="font-size:16px; color:#adadb8; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + new Date(v.created_at).toLocaleDateString() + '</div>' +
                        '</div>' +
                    '</div>';
            }).join('');
        },

        renderClipItems: function() {
            if (state.clips.length === 0) return '<div style="color:#adadb8; font-size:20px;">Nessuna clip trovata.</div>';
            return state.clips.slice(0, state.visibleClips).map(function(c, i) {
                return '<div id="chan-item-3-' + i + '" class="channel-card" style="width:560px; margin-right:20px; flex-shrink:0;">' +
                        '<div class="badge-viewers no-dot" style="top:20px; right:20px; bottom:auto; left:auto;">' + App.utils.formatViewers(c.view_count) + ' views</div>' +
                        '<img src="' + c.thumbnail_url + '" loading="lazy" style="width:100%; height:100%; object-fit:cover;">' +
                        '<div class="card-info">' +
                            '<div style="font-size:22px; font-weight:bold; color:white;">' + c.title + '</div>' +
                            '<div style="font-size:16px; color:#adadb8; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + c.creator_name + '</div>' +
                        '</div>' +
                    '</div>';
            }).join('');
        },

        updateSelection: function() {
            var cards = document.querySelectorAll('.channel-card');
            for (var i = 0; i < cards.length; i++) cards[i].classList.remove('selected');

            var targetContainer = null;
            if (state.activeSection === 1) {
                var item = document.getElementById('chan-item-1-' + state.vodCol);
                if (item) item.classList.add('selected');
                var strip = document.getElementById('chan-vods-strip');
                if (strip) strip.style.transform = 'translateX(-' + (state.vodCol * 580) + 'px)';
                targetContainer = document.getElementById('section-1');
            } else if (state.activeSection === 3) {
                var item = document.getElementById('chan-item-3-' + state.clipCol);
                if (item) item.classList.add('selected');
                var strip = document.getElementById('chan-clips-strip');
                if (strip) strip.style.transform = 'translateX(-' + (state.clipCol * 580) + 'px)';
                targetContainer = document.getElementById('section-3');
            }

            if (targetContainer) targetContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            else if (App.nav.inMenu) window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        handleKey: function(e) {
            if (e.keyCode === 39) { 
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
            } else if (e.keyCode === 37) { 
                if (state.activeSection === 1 && state.vodCol > 0) state.vodCol--;
                else if (state.activeSection === 3 && state.clipCol > 0) state.clipCol--;
            } else if (e.keyCode === 40) { 
                if (state.activeSection === 1 && state.clips.length > 0) state.activeSection = 3;
            } else if (e.keyCode === 38) { 
                if (state.activeSection === 3 && state.vods.length > 0) state.activeSection = 1;
            } else if (e.keyCode === 13) { 
                if (state.activeSection === 1) {
                    var v = state.vods[state.vodCol];
                    if (v.isLiveItem) {
                        App.nav.navigateTo('player').then(function() {
                            App.modules.player.openNativePlayer(v.user_name, v.id, v.title);
                        });
                    } else { alert("La riproduzione dei VOD richiede l'integrazione con l'API Usher per i VOD."); }
                } else if (state.activeSection === 3) {
                    var c = state.clips[state.clipCol];
                    App.nav.navigateTo('player').then(function() {
                        App.modules.player.openNativePlayer(c.creator_name, state.channelData.id, c.title, c);
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
            App.nav.navigateTo(prevModule).then(function() {
                if (App.modules[prevModule] && App.modules[prevModule].updateSelection) App.modules[prevModule].updateSelection();
            });
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