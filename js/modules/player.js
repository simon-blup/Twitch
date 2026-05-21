(function() {
    var state = {
        inPlayer: false,
        uiTimeout: null,
        playerFocusIndex: 0, 
        playerBtns: [],
        isPlaying: true,
        isQualityMenuOpen: false,
        isChatOpen: false,
        qualityOptions: [],
        qualityFocusIndex: 0,
        currentStreamChannel: "",
        currentStreamId: "",
        currentStreamTitle: "",
        currentVideoUrl: "",
        bufferingWatchdog: null,
        retryCount: 0,
        isVod: false,
        vodData: null,
        seekHoldTimer: null,
        seekHoldCount: 0,
        seekBarUpdateInterval: null,
        currentTime: 0,
        totalDuration: 0,
        isSeekBarFocused: false
    };

    var LIVE_BTNS = ['btn-play', 'btn-chat', 'btn-quality', 'btn-goto-channel'];
    var VOD_BTNS = ['btn-play', 'btn-seek-back', 'btn-seek-forward', 'btn-quality', 'btn-goto-channel'];

    App.modules.player = {
        init: function() {},
        load: function() { return Promise.resolve(); },

        getStreamM3u8: function(channel) {
            var gqlBody = {
                operationName: 'PlaybackAccessToken_Template',
                query: 'query PlaybackAccessToken_Template($login: String!, $playerType: String!) {  streamPlaybackAccessToken(channelName: $login, params: {platform: "web", playerBackend: "mediaplayer", playerType: $playerType}) { value signature } }',
                variables: { login: channel, playerType: 'site' }
            };
            var headers = { 'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko', 'Content-Type': 'application/json' };

            return fetch('https://gql.twitch.tv/gql', {
                method: 'POST', headers: headers,
                body: JSON.stringify(gqlBody)
            })
            .then(function(res) { return res.json(); })
            .then(function(tokenData) {
                if (tokenData.errors && tokenData.errors.length > 0) throw new Error("GQL Error: " + tokenData.errors[0].message);
                var accessToken = tokenData.data.streamPlaybackAccessToken;
                var value = accessToken.value;
                var signature = accessToken.signature;
                var originalUsherUrl = 'https://usher.ttvnw.net/api/channel/hls/' + channel + '.m3u8?allow_source=true&sig=' + signature + '&token=' + encodeURIComponent(value) + '&reassignments_supported=true&playlist_include_framerate=true&p=' + Math.random();
                var m3u8Url = originalUsherUrl;
                
                var promise = App.settings.adBlock ? 
                    fetch('https://lb-eu.cdn-perfprod.com/live/' + channel + '?allow_source=true&sig=' + signature + '&token=' + encodeURIComponent(value) + '&reassignments_supported=true&playlist_include_framerate=true')
                    .then(function(r) { return r.ok ? r : fetch(originalUsherUrl); })
                    .catch(function() { return fetch(originalUsherUrl); }) :
                    fetch(originalUsherUrl);

                return promise.then(function(res) {
                    if (!res.ok) throw new Error('Usher HTTP ' + res.status);
                    return res.text();
                }).then(function(m3u8Text) {
                    return App.modules.player.parseM3u8(m3u8Text, m3u8Url);
                });
            })
            .catch(function(e) {
                console.error("getStreamM3u8 error:", e);
                return { error: e.message };
            });
        },

        parseM3u8: function(m3u8Text, masterUrl) {
            var lines = m3u8Text.split('\n');
            var streams = [{ name: 'Auto', url: masterUrl }];
            var currentName = null;
            var mediaMap = {};
            lines.forEach(function(line) {
                if (line.indexOf('#EXT-X-MEDIA:TYPE=VIDEO') === 0) {
                    var groupIdMatch = line.match(/GROUP-ID="([^"]+)"/);
                    var nameMatch = line.match(/NAME="([^"]+)"/);
                    if (groupIdMatch && nameMatch) {
                        mediaMap[groupIdMatch[1]] = nameMatch[1].replace(/\(source\)/gi, '').trim();
                    }
                }
            });
            lines.forEach(function(line) {
                if (line.indexOf('#EXT-X-STREAM-INF') === 0) {
                    var videoMatch = line.match(/VIDEO="([^"]+)"/);
                    var groupId = videoMatch ? videoMatch[1] : null;
                    currentName = groupId && mediaMap[groupId] ? mediaMap[groupId] : (groupId || 'Unknown');
                } else if (line.indexOf('http') === 0 && currentName) {
                    streams.push({ name: currentName, url: line });
                    currentName = null;
                }
            });
            var otherOptions = streams.slice(1);
            otherOptions.sort(function(a, b) {
                var getRes = function(s) { var m = s.name.match(/(\d+)p/); return m ? parseInt(m[1]) : 0; };
                return getRes(b) - getRes(a);
            });
            return [streams[0]].concat(otherOptions);
        },

        getVodM3u8: function(vodId) {
            var cleanId = vodId.toString().replace(/^v/, '');
            var gqlBody = {
                operationName: 'PlaybackAccessToken_Template',
                query: 'query PlaybackAccessToken_Template($login: String!, $isLive: Boolean!, $vodID: ID!, $isVod: Boolean!, $playerType: String!) {  streamPlaybackAccessToken(channelName: $login, params: {platform: "web", playerBackend: "mediaplayer", playerType: $playerType}) @include(if: $isLive) { value signature }  videoPlaybackAccessToken(id: $vodID, params: {platform: "web", playerBackend: "mediaplayer", playerType: $playerType}) @include(if: $isVod) { value signature } }',
                variables: { login: '', isLive: false, vodID: cleanId, isVod: true, playerType: 'site' }
            };
            return fetch('https://gql.twitch.tv/gql', {
                method: 'POST',
                headers: { 'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko', 'Content-Type': 'application/json' },
                body: JSON.stringify(gqlBody)
            })
            .then(function(res) { return res.json(); })
            .then(function(tokenData) {
                if (tokenData.errors && tokenData.errors.length > 0) throw new Error("GQL VOD Error: " + tokenData.errors[0].message);
                var accessToken = tokenData.data.videoPlaybackAccessToken;
                if (!accessToken) throw new Error("No VOD access token");
                var value = accessToken.value;
                var signature = accessToken.signature;
                var usherUrl = 'https://usher.ttvnw.net/vod/' + cleanId + '.m3u8?allow_source=true&sig=' + signature + '&token=' + encodeURIComponent(value) + '&playlist_include_framerate=true&p=' + Math.random();
                return fetch(usherUrl).then(function(res) {
                    if (!res.ok) throw new Error('VOD Usher HTTP ' + res.status);
                    return res.text();
                }).then(function(m3u8Text) {
                    return App.modules.player.parseM3u8(m3u8Text, usherUrl);
                });
            })
            .catch(function(e) {
                console.error("getVodM3u8 error:", e);
                return { error: e.message };
            });
        },

        parseDuration: function(durationStr) {
            if (!durationStr) return 0;
            var hours = 0, minutes = 0, seconds = 0;
            var hMatch = durationStr.match(/(\d+)h/);
            var mMatch = durationStr.match(/(\d+)m/);
            var sMatch = durationStr.match(/(\d+)s/);
            if (hMatch) hours = parseInt(hMatch[1]);
            if (mMatch) minutes = parseInt(mMatch[1]);
            if (sMatch) seconds = parseInt(sMatch[1]);
            return hours * 3600 + minutes * 60 + seconds;
        },

        formatTime: function(sec) {
            sec = Math.max(0, Math.floor(sec));
            var h = Math.floor(sec / 3600);
            var m = Math.floor((sec % 3600) / 60);
            var s = sec % 60;
            if (h > 0) return h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
            return m + ':' + (s < 10 ? '0' : '') + s;
        },

        openNativePlayer: function(channelName, channelId, streamTitle, clipData, vodData) {
            var self = this;
            state.inPlayer = true;
            state.playerFocusIndex = 0; 
            App.nav.inMenu = false;
            state.isVod = !!vodData;
            state.vodData = vodData || null;
            state.currentTime = 0;
            state.totalDuration = 0;
            state.isSeekBarFocused = false;
            state.seekHoldCount = 0;

            if (state.isVod) {
                state.playerBtns = VOD_BTNS.slice();
            } else {
                state.playerBtns = LIVE_BTNS.slice();
            }

            var appContainer = document.getElementById('app-container');
            if (appContainer) appContainer.style.display = 'none';

            state.currentStreamChannel = channelName;
            state.currentStreamId = channelId;
            state.currentStreamTitle = streamTitle || "";

            var titleEl = document.getElementById('player-live-title');
            if (titleEl) titleEl.innerText = state.currentStreamTitle;
            
            // Show/hide buttons based on mode
            var chatBtn = document.getElementById('btn-chat');
            if (chatBtn) chatBtn.style.display = state.isVod ? 'none' : '-webkit-flex';

            var seekBackBtn = document.getElementById('btn-seek-back');
            if (seekBackBtn) seekBackBtn.style.display = state.isVod ? '-webkit-flex' : 'none';

            var seekFwdBtn = document.getElementById('btn-seek-forward');
            if (seekFwdBtn) seekFwdBtn.style.display = state.isVod ? '-webkit-flex' : 'none';

            var seekBarContainer = document.getElementById('vod-seekbar-container');
            if (seekBarContainer) seekBarContainer.style.display = state.isVod ? '-webkit-flex' : 'none';

            var existingPlayer = document.getElementById('av-player');
            if (!existingPlayer) {
                existingPlayer = document.createElement('object');
                existingPlayer.id = 'av-player';
                existingPlayer.setAttribute('type', 'application/avplayer');
                existingPlayer.setAttribute('style', 'width:100%; height:100%; position: absolute; z-index: -1;');
                document.getElementById('player-container').appendChild(existingPlayer);
            }

            document.getElementById('player-container').style.display = 'block';
            document.body.classList.add('player-active');
            document.documentElement.classList.add('player-active');

            var startPlayback = function(options) {
                state.qualityOptions = options;
                var defaultUrl = options.length > 1 ? options[1].url : options[0].url;
                self.playVideoUrl(defaultUrl);
                self.showPlayerUI();
                self.updatePlayerFocus();
            };

            if (state.isVod) {
                var vodId = vodData.id;
                if (vodData.duration) {
                    state.totalDuration = this.parseDuration(vodData.duration);
                }
                this.getVodM3u8(vodId).then(function(options) {
                    if (options.error) { alert("VOD Error: " + options.error); self.closeNativePlayer(); return; }
                    if (!options || options.length === 0) { alert("Error: No VOD stream found."); self.closeNativePlayer(); return; }
                    startPlayback(options);
                    self.startSeekBarUpdates();
                }).catch(function(e) {
                    console.error("VOD error:", e);
                    alert("VOD Error: " + e.message);
                    self.closeNativePlayer();
                });
            } else {
                this.getStreamM3u8(channelName).then(function(options) {
                    if (options.error) { alert("Fetch Error: " + options.error); self.closeNativePlayer(); return; }
                    if (!options || options.length === 0) { alert("Error: No stream for " + channelName); self.closeNativePlayer(); return; }
                    startPlayback(options);
                });
            }
        },

        startSeekBarUpdates: function() {
            var self = this;
            clearInterval(state.seekBarUpdateInterval);
            state.seekBarUpdateInterval = setInterval(function() {
                if (!state.inPlayer || !state.isVod) { clearInterval(state.seekBarUpdateInterval); return; }
                try {
                    state.currentTime = webapis.avplay.getCurrentTime() / 1000;
                    if (state.totalDuration <= 0) {
                        try { var dur = webapis.avplay.getDuration(); if (dur > 0) state.totalDuration = dur / 1000; } catch(e) {}
                    }
                    self.updateSeekBar();
                } catch(e) {}
            }, 1000);
        },

        updateSeekBar: function() {
            var fill = document.getElementById('seekbar-fill');
            var thumb = document.getElementById('seekbar-thumb');
            var timeText = document.getElementById('seekbar-time');
            if (!fill || !thumb || !timeText) return;
            var pct = state.totalDuration > 0 ? Math.min(100, (state.currentTime / state.totalDuration) * 100) : 0;
            fill.style.width = pct + '%';
            thumb.style.left = pct + '%';
            timeText.textContent = this.formatTime(state.currentTime) + ' / ' + this.formatTime(state.totalDuration);
        },

        playVideoUrl: function(url, isRetry) {
            var self = this;
            state.currentVideoUrl = url;
            if (!isRetry) state.retryCount = 0;
            clearTimeout(state.bufferingWatchdog);
            try { webapis.avplay.stop(); webapis.avplay.close(); } catch (e) { }

            try {
                webapis.avplay.open(url);
                try {
                    webapis.avplay.setBufferingParam('PLAYER_BUFFER_FOR_PLAY', 'PLAYER_BUFFER_SIZE_IN_SECOND', 5);
                    webapis.avplay.setBufferingParam('PLAYER_BUFFER_FOR_RESUME', 'PLAYER_BUFFER_SIZE_IN_SECOND', 5);
                } catch (bufErr) {}

                var listener = {
                    onbufferingstart: function() {
                        clearTimeout(state.bufferingWatchdog);
                        state.bufferingWatchdog = setTimeout(function() {
                            if (state.retryCount < 3) { state.retryCount++; self.playVideoUrl(state.currentVideoUrl, true); }
                        }, 15000);
                    },
                    onbufferingprogress: function() {},
                    onbufferingcomplete: function() { clearTimeout(state.bufferingWatchdog); },
                    onstreamcompleted: function() {
                        try { webapis.avplay.stop(); } catch(e){}
                        state.isPlaying = false;
                        document.getElementById('icon-pause').style.display = 'none';
                        document.getElementById('icon-play').style.display = 'block';
                    },
                    oncurrentplaytime: function(currentTime) {
                        clearTimeout(state.bufferingWatchdog);
                        if (state.isVod) state.currentTime = currentTime / 1000;
                    },
                    onerror: function() {
                        clearTimeout(state.bufferingWatchdog);
                        if (state.retryCount < 3) { state.retryCount++; setTimeout(function() { self.playVideoUrl(state.currentVideoUrl, true); }, 2000); }
                    },
                    ondrmevent: function() {},
                    onsubtitlechange: function() {}
                };

                webapis.avplay.setListener(listener);
                webapis.avplay.setDisplayMethod(state.isChatOpen ? 'PLAYER_DISPLAY_MODE_LETTER_BOX' : 'PLAYER_DISPLAY_MODE_FULL_SCREEN');
                webapis.avplay.prepareAsync(function() {
                    if (state.isChatOpen) {
                        try { webapis.avplay.setDisplayRect(0, 126, 1470, 827); } catch(e) {}
                    } else {
                        try { webapis.avplay.setDisplayRect(0, 0, 1920, 1080); } catch(e) {}
                    }
                    webapis.avplay.play();
                    state.isPlaying = true;
                    document.getElementById('icon-pause').style.display = 'block';
                    document.getElementById('icon-play').style.display = 'none';
                    if (state.isVod && state.totalDuration <= 0) {
                        try { var dur = webapis.avplay.getDuration(); if (dur > 0) state.totalDuration = dur / 1000; } catch(e) {}
                    }
                }, function(error) {
                    console.error("AVPlay prepare error: " + error);
                    if (state.retryCount < 3) { state.retryCount++; setTimeout(function() { self.playVideoUrl(state.currentVideoUrl, true); }, 2000); }
                });
            } catch (e) { console.error("AVPlay open error: ", e); }
        },

        toggleChat: function() {
            var chatContainer = document.getElementById('player-chat-container');
            if (!state.isChatOpen) {
                state.isChatOpen = true;
                chatContainer.classList.remove('hidden');
                App.loader.load('chat').then(function() { if (App.modules.chat) App.modules.chat.connect(state.currentStreamChannel); });
                try { webapis.avplay.setDisplayMethod('PLAYER_DISPLAY_MODE_LETTER_BOX'); webapis.avplay.setDisplayRect(0, 126, 1470, 827); } catch(e) {}
            } else {
                state.isChatOpen = false;
                chatContainer.classList.add('hidden');
                if (App.modules.chat) App.modules.chat.disconnect();
                try { webapis.avplay.setDisplayMethod('PLAYER_DISPLAY_MODE_FULL_SCREEN'); webapis.avplay.setDisplayRect(0, 0, 1920, 1080); } catch(e) {}
            }
        },

        seekBy: function(seconds) {
            if (!state.isVod) return;
            try {
                var currentMs = webapis.avplay.getCurrentTime();
                var targetMs = currentMs + (seconds * 1000);
                if (targetMs < 0) targetMs = 0;
                var durMs = state.totalDuration * 1000;
                if (durMs > 0 && targetMs > durMs) targetMs = durMs - 1000;
                webapis.avplay.seekTo(targetMs);
                state.currentTime = targetMs / 1000;
                this.updateSeekBar();
            } catch(e) { console.error("Seek error:", e); }
        },

        seekToPercent: function(pct) {
            if (!state.isVod || state.totalDuration <= 0) return;
            try {
                var targetMs = (pct / 100) * state.totalDuration * 1000;
                if (targetMs < 0) targetMs = 0;
                if (targetMs > state.totalDuration * 1000) targetMs = (state.totalDuration - 1) * 1000;
                webapis.avplay.seekTo(targetMs);
                state.currentTime = targetMs / 1000;
                this.updateSeekBar();
            } catch(e) {}
        },

        getSeekAmount: function() {
            if (state.seekHoldCount <= 1) return 60;
            if (state.seekHoldCount <= 3) return 120;
            if (state.seekHoldCount <= 6) return 300;
            return 600;
        },

        closeNativePlayer: function() {
            state.inPlayer = false;
            clearInterval(state.seekBarUpdateInterval);
            clearTimeout(state.seekHoldTimer);
            if (state.isChatOpen) {
                state.isChatOpen = false;
                var chatContainer = document.getElementById('player-chat-container');
                if (chatContainer) chatContainer.classList.add('hidden');
                if (App.modules.chat) App.modules.chat.disconnect();
            }
            var appContainer = document.getElementById('app-container');
            if (appContainer) appContainer.style.display = 'block';
            try { webapis.avplay.stop(); webapis.avplay.close(); } catch (e) {}
            document.body.classList.remove('player-active');
            document.documentElement.classList.remove('player-active');
            document.getElementById('player-container').style.display = 'none';
            state.isQualityMenuOpen = false; 
            document.getElementById('quality-menu').style.display = 'none';
            clearTimeout(state.uiTimeout);
            App.loader.unload('player');
            if (App.previousModule) {
                App.nav.navigateTo(App.previousModule).then(function() {
                    if (App.modules[App.previousModule] && App.modules[App.previousModule].updateSelection) App.modules[App.previousModule].updateSelection();
                });
            } else { App.nav.inMenu = true; App.nav.update(); }
        },

        showPlayerUI: function() {
            var ui = document.getElementById('player-ui');
            ui.classList.remove('hidden');
            clearTimeout(state.uiTimeout);
            state.uiTimeout = setTimeout(function() { if (!state.isQualityMenuOpen) ui.classList.add('hidden'); }, 4000);
        },

        updatePlayerFocus: function() {
            if (state.isQualityMenuOpen) {
                var items = document.querySelectorAll('.quality-item');
                for (var i = 0; i < items.length; i++) items[i].classList.toggle('focused', i === state.qualityFocusIndex);
                return;
            }
            // Clear all
            var allBtnIds = ['btn-play', 'btn-chat', 'btn-seek-back', 'btn-seek-forward', 'btn-quality', 'btn-goto-channel'];
            for (var i = 0; i < allBtnIds.length; i++) {
                var btn = document.getElementById(allBtnIds[i]);
                if (btn) btn.classList.remove('focused');
            }
            var seekbarContainer = document.getElementById('vod-seekbar-container');
            if (seekbarContainer) {
                if (state.isSeekBarFocused) seekbarContainer.classList.add('seekbar-focused');
                else seekbarContainer.classList.remove('seekbar-focused');
            }
            if (state.isSeekBarFocused) return;
            var currentBtnId = state.playerBtns[state.playerFocusIndex];
            if (currentBtnId) {
                var btn = document.getElementById(currentBtnId);
                if (btn) btn.classList.add('focused');
            }
        },

        handleKey: function(e) {
            if (!state.inPlayer) return;
            var self = this;
            var ui = document.getElementById('player-ui');
            var isUIHidden = ui.classList.contains('hidden');

            if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
                if (state.isQualityMenuOpen) {
                    state.isQualityMenuOpen = false; document.getElementById('quality-menu').style.display = 'none';
                    this.showPlayerUI(); this.updatePlayerFocus();
                } else if (state.isSeekBarFocused) {
                    state.isSeekBarFocused = false;
                    this.showPlayerUI(); this.updatePlayerFocus();
                } else this.closeNativePlayer();
                return;
            }

            if (isUIHidden) {
                if (e.keyCode === 13 || (e.keyCode >= 37 && e.keyCode <= 40)) { this.showPlayerUI(); this.updatePlayerFocus(); }
                return;
            }

            this.showPlayerUI();

            if (state.isQualityMenuOpen) {
                if (e.keyCode === 38 && state.qualityFocusIndex > 0) state.qualityFocusIndex--;
                if (e.keyCode === 40 && state.qualityFocusIndex < state.qualityOptions.length - 1) state.qualityFocusIndex++;
                if (e.keyCode === 13) {
                    this.playVideoUrl(state.qualityOptions[state.qualityFocusIndex].url);
                    state.isQualityMenuOpen = false; document.getElementById('quality-menu').style.display = 'none';
                    if (state.isVod) this.startSeekBarUpdates();
                }
                this.updatePlayerFocus(); return;
            }

            if (state.isSeekBarFocused) {
                if (e.keyCode === 39) {
                    var pct = state.totalDuration > 0 ? (state.currentTime / state.totalDuration) * 100 : 0;
                    this.seekToPercent(Math.min(100, pct + 1));
                } else if (e.keyCode === 37) {
                    var pct = state.totalDuration > 0 ? (state.currentTime / state.totalDuration) * 100 : 0;
                    this.seekToPercent(Math.max(0, pct - 1));
                } else if (e.keyCode === 38 || e.keyCode === 13) {
                    state.isSeekBarFocused = false;
                    this.updatePlayerFocus();
                }
                this.showPlayerUI();
                return;
            }

            if (e.keyCode === 39 && state.playerFocusIndex < state.playerBtns.length - 1) state.playerFocusIndex++;
            if (e.keyCode === 37 && state.playerFocusIndex > 0) state.playerFocusIndex--;
            if (e.keyCode === 40 && state.isVod) {
                state.isSeekBarFocused = true;
                this.updatePlayerFocus(); this.showPlayerUI(); return;
            }

            if (e.keyCode === 13) {
                var currentBtnId = state.playerBtns[state.playerFocusIndex];
                if (currentBtnId === 'btn-play') {
                    try {
                        if (state.isPlaying) {
                            webapis.avplay.pause(); state.isPlaying = false;
                            document.getElementById('icon-pause').style.display = 'none';
                            document.getElementById('icon-play').style.display = 'block';
                        } else {
                            webapis.avplay.play(); state.isPlaying = true;
                            document.getElementById('icon-pause').style.display = 'block';
                            document.getElementById('icon-play').style.display = 'none';
                        }
                    } catch (ex) {}
                } else if (currentBtnId === 'btn-chat') {
                    this.toggleChat();
                } else if (currentBtnId === 'btn-seek-back') {
                    state.seekHoldCount++;
                    this.seekBy(-this.getSeekAmount());
                    clearTimeout(state.seekHoldTimer);
                    state.seekHoldTimer = setTimeout(function() { state.seekHoldCount = 0; }, 800);
                } else if (currentBtnId === 'btn-seek-forward') {
                    state.seekHoldCount++;
                    this.seekBy(this.getSeekAmount());
                    clearTimeout(state.seekHoldTimer);
                    state.seekHoldTimer = setTimeout(function() { state.seekHoldCount = 0; }, 800);
                } else if (currentBtnId === 'btn-quality') {
                    var menu = document.getElementById('quality-menu');
                    menu.innerHTML = state.qualityOptions.map(function(q) { return '<div class="quality-item">' + q.name + '</div>'; }).join('');
                    menu.style.display = '-webkit-flex'; state.isQualityMenuOpen = true; state.qualityFocusIndex = 0;
                    var items = menu.querySelectorAll('.quality-item');
                    if (items[0]) items[0].classList.add('focused');
                } else if (currentBtnId === 'btn-goto-channel') {
                    var ch = state.currentStreamChannel;
                    this.closeNativePlayer();
                    App.nav.navigateTo('channel').then(function() {
                        if (App.modules.channel && App.modules.channel.openChannelView) App.modules.channel.openChannelView(ch);
                    });
                }
            }
            this.updatePlayerFocus();
        },

        destroy: function() {
            clearInterval(state.seekBarUpdateInterval);
            clearTimeout(state.seekHoldTimer);
            if (state.inPlayer) this.closeNativePlayer();
        }
    };
})();