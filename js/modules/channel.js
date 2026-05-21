(function() {
    var state = {
        channelLogin: '',
        channelData: null,
        followerCount: 0,
        isLive: false,
        liveStreamData: null,
        vods: [], 
        activeSection: 1, 
        vodCol: 0,
        seqId: 0,
        visibleVods: 6
    };

    App.modules.channel = {
        init: function() {},

        load: function(isRestore) {
            if (isRestore && state.vods.length > 0) {
                this.render();
            }
            return Promise.resolve();
        },

        openChannelView: function(login) {
            state.channelLogin = login.toLowerCase();
            state.seqId = Date.now();
            state.activeSection = 1; 
            state.vodCol = 0;
            state.channelData = null;
            state.followerCount = 0;
            state.isLive = false;
            state.liveStreamData = null;
            state.vods = [];
            state.visibleVods = 6;

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
                    return self.fetchVods();
                })
                .then(function() {
                    if (mySeq !== state.seqId) return;
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

        renderLoading: function() {
            var viewArea = document.getElementById('main-view-area');
            if (viewArea) {
                viewArea.innerHTML = '<div style="display:-webkit-flex; display:flex; -webkit-justify-content:center; justify-content:center; -webkit-align-items:center; align-items:center; height:100vh; font-size:24px; color:#adadb8;">' + App.t('loading') + '</div>';
            }
        },

        render: function() {
            var viewArea = document.getElementById('main-view-area');
            if (!viewArea) return;

            var isLight = document.body.classList.contains('theme-light');
            var titleColor = isLight ? '#000' : 'white';
            var banner = state.channelData.offline_image_url || state.channelData.profile_image_url || '';
            var isAvatarFallback = !state.channelData.offline_image_url;
            
            var bannerHtml = banner ? '<div style="position: absolute; top: 0; left: 0; width: 100%; height: 500px; z-index: -1; overflow: hidden; opacity: 0.4;">' +
                    '<div style="width: 100%; height: 100%; background-image: url(\'' + banner + '\'); background-size: cover; background-position: center; ' + (isAvatarFallback ? '-webkit-filter: blur(20px); filter: blur(20px); -webkit-transform: scale(1.2); transform: scale(1.2);' : '') + '"></div>' +
                    '<div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 200px; background: linear-gradient(to bottom, transparent, #0e0e10);"></div>' +
                '</div>' : '';

            var html = '<div id="channel-view" style="padding: 60px 0; color: white; width: 100%; overflow-x: hidden; position: relative;">' +
                    bannerHtml +
                    '<div style="display:-webkit-flex; display:flex; -webkit-align-items:flex-start; align-items:flex-start; margin-bottom:60px; padding: 0 80px;">' +
                        '<div style="display:-webkit-flex; display:flex; -webkit-flex:1; flex:1;">' +
                            '<img src="' + state.channelData.profile_image_url + '" style="width:180px; height:180px; border-radius:50%; border:6px solid #18181b; background:#18181b; box-shadow: 0 10px 30px rgba(0,0,0,0.5); margin-right:40px; -webkit-flex-shrink:0; flex-shrink:0;">' +
                            '<div style="padding-top:20px;">' +
                                '<h1 style="font-size:54px; margin:0; font-weight:bold; color:' + titleColor + ';">' + state.channelData.display_name + '</h1>' +
                                '<div style="font-size:20px; color:#adadb8; margin-top:10px; max-width: 800px; line-height: 1.4;">' + (state.channelData.description || '') + '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div style="padding-top:50px; text-align:right; -webkit-flex-shrink:0; flex-shrink:0;">' +
                            '<div style="font-size:22px; font-weight:bold; color:' + titleColor + ';">' + App.utils.formatViewers(state.followerCount) + '</div>' +
                            '<div style="font-size:14px; color:#adadb8; text-transform:uppercase; letter-spacing:1px;">' + App.t('followers') + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div id="section-1" style="margin-bottom:60px; ' + (state.vods.length === 0 ? 'display:none;' : '') + '">' +
                        '<div style="display:-webkit-flex; display:flex; -webkit-align-items:center; align-items:center; margin-bottom:20px; padding: 0 80px;">' +
                            '<h2 style="font-size:32px; margin:0;">Video ' + (state.isLive ? '& Diretta' : '') + '</h2>' +
                        '</div>' +
                        '<div style="width: 100%; overflow: visible;">' +
                            '<div id="chan-vods-strip" style="display:-webkit-flex; display:flex; -webkit-flex-direction:row; flex-direction:row; padding: 10px 80px; -webkit-transition: -webkit-transform 0.3s cubic-bezier(0.23, 1, 0.32, 1); transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1); -webkit-transform: translateX(0px); transform: translateX(0px);">' +
                                this.renderVodItems() +
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

                return '<div id="chan-item-1-' + i + '" class="channel-card" style="width:560px; margin-right:20px; -webkit-flex-shrink:0; flex-shrink:0;">' +
                        durationBadge + viewerBadge +
                        '<img src="' + thumb + '" onerror="this.src=\'https://vod-secure.twitch.tv/_404/404_processing_600x338.png\'" style="width:100%; height:100%; object-fit:cover;">' +
                        '<div class="card-info">' +
                            '<div style="font-size:22px; font-weight:bold; color:white;">' + v.title + '</div>' +
                            '<div style="font-size:16px; color:#adadb8; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + new Date(v.created_at).toLocaleDateString() + '</div>' +
                        '</div>' +
                    '</div>';
            }).join('');
        },

        updateSelection: function() {
            var cards = document.querySelectorAll('#channel-view .channel-card');
            for (var i = 0; i < cards.length; i++) cards[i].classList.remove('selected');

            if (state.activeSection === 1) {
                var item = document.getElementById('chan-item-1-' + state.vodCol);
                if (item && !App.nav.inMenu) item.classList.add('selected');
                var strip = document.getElementById('chan-vods-strip');
                if (strip) {
                    strip.style.webkitTransform = 'translateX(-' + (state.vodCol * 580) + 'px)';
                    strip.style.transform = 'translateX(-' + (state.vodCol * 580) + 'px)';
                }
                var targetContainer = document.getElementById('section-1');
                if (targetContainer && !App.nav.inMenu) targetContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            if (App.nav.inMenu) window.scrollTo({ top: 0, behavior: 'smooth' });
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
                }
            } else if (e.keyCode === 37) { 
                if (state.activeSection === 1 && state.vodCol > 0) state.vodCol--;
            } else if (e.keyCode === 38) { 
                App.nav.inMenu = true; App.nav.update();
            } else if (e.keyCode === 13) { 
                if (state.activeSection === 1) {
                    var v = state.vods[state.vodCol];
                    if (v.isLiveItem) {
                        App.nav.navigateTo('player').then(function() {
                            App.modules.player.openNativePlayer(v.user_name, v.id, v.title);
                        });
                    } else {
                        App.nav.navigateTo('player').then(function() {
                            App.modules.player.openNativePlayer(v.user_name, state.channelData.id, v.title, null, v);
                        });
                    }
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