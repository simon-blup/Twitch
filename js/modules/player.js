(function() {
    var state = {
        inPlayer: false,
        uiTimeout: null,
        playerFocusIndex: 0, 
        playerBtns: ['btn-play', 'btn-chat', 'btn-quality', 'btn-goto-channel'],
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
        isClip: false
    };

    App.modules.player = {
        init: function() {},

        load: function() { return Promise.resolve(); },

        getStreamM3u8: function(channel) {
            var self = this;
            var gqlBody = {
                operationName: 'PlaybackAccessToken_Template',
                query: 'query PlaybackAccessToken_Template($login: String!, $playerType: String!) {  streamPlaybackAccessToken(channelName: $login, params: {platform: "web", playerBackend: "mediaplayer", playerType: $playerType}) { value signature } }',
                variables: { login: channel, playerType: 'site' }
            };

            var headers = { 'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko', 'Content-Type': 'application/json' };

            return fetch('https://gql.twitch.tv/gql', {
                method: 'POST',
                headers: headers,
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
                    var lines = m3u8Text.split('\n');
                    var streams = [{ name: 'Auto', url: m3u8Url }];
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
                        var getRes = function(s) {
                            var m = s.name.match(/(\d+)p/);
                            return m ? parseInt(m[1]) : 0;
                        };
                        return getRes(b) - getRes(a);
                    });
                    return [streams[0]].concat(otherOptions);
                });
            })
            .catch(function(e) {
                console.error("getStreamM3u8 error:", e);
                return { error: e.message };
            });
        },

        openNativePlayer: function(channelName, channelId, streamTitle, clipData) {
            var self = this;
            state.inPlayer = true;
            state.playerFocusIndex = 0; 
            App.nav.inMenu = false;
            state.isClip = !!clipData;

            var appContainer = document.getElementById('app-container');
            if (appContainer) appContainer.style.display = 'none';

            state.currentStreamChannel = channelName;
            state.currentStreamId = channelId;
            state.currentStreamTitle = streamTitle || "";

            var titleEl = document.getElementById('player-live-title');
            if (titleEl) titleEl.innerText = state.currentStreamTitle;
            
            var chatBtn = document.getElementById('btn-chat');
            if (chatBtn) chatBtn.style.display = state.isClip ? 'none' : 'flex';

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

            if (state.isClip) {
                var mp4Url = "";
                if (typeof clipData === 'object' && clipData.thumbnail_url) {
                    mp4Url = clipData.thumbnail_url.split('-preview')[0] + '.mp4';
                } else if (typeof clipData === 'string' && clipData.indexOf('.mp4') !== -1) {
                    mp4Url = clipData;
                } else {
                    alert("Clip playback requires direct MP4 link.");
                    this.closeNativePlayer();
                    return;
                }
                startPlayback([{ name: 'Source', url: mp4Url }]);
            } else {
                this.getStreamM3u8(channelName).then(function(options) {
                    if (options.error) { alert("Fetch Error: " + options.error); self.closeNativePlayer(); return; }
                    if (!options || options.length === 0) { alert("Error: No stream for " + channelName); self.closeNativePlayer(); return; }
                    startPlayback(options);
                });
            }
        },

        playVideoUrl: function(url, isRetry) {
            var self = this;
            state.currentVideoUrl = url;
            if (!isRetry) state.retryCount = 0;
            
            clearTimeout(state.bufferingWatchdog);

            try {
                webapis.avplay.stop();
                webapis.avplay.close();
            } catch (e) { }

            try {
                webapis.avplay.open(url);
                try {
                    webapis.avplay.setBufferingParam('PLAYER_BUFFER_FOR_PLAY', 'PLAYER_BUFFER_SIZE_IN_SECOND', 5);
                    webapis.avplay.setBufferingParam('PLAYER_BUFFER_FOR_RESUME', 'PLAYER_BUFFER_SIZE_IN_SECOND', 5);
                } catch (bufErr) { console.warn("Buffering params error", bufErr); }

                var listener = {
                    onbufferingstart: function() {
                        clearTimeout(state.bufferingWatchdog);
                        state.bufferingWatchdog = setTimeout(function() {
                            if (state.retryCount < 3) {
                                state.retryCount++;
                                self.playVideoUrl(state.currentVideoUrl, true);
                            }
                        }, 15000);
                    },
                    onbufferingprogress: function(percent) {},
                    onbufferingcomplete: function() { clearTimeout(state.bufferingWatchdog); },
                    onstreamcompleted: function() { try { webapis.avplay.stop(); } catch(e){} },
                    oncurrentplaytime: function(currentTime) { clearTimeout(state.bufferingWatchdog); },
                    onerror: function(eventType) {
                        clearTimeout(state.bufferingWatchdog);
                        if (state.retryCount < 3) {
                            state.retryCount++;
                            setTimeout(function() { self.playVideoUrl(state.currentVideoUrl, true); }, 2000);
                        }
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
                }, function(error) {
                    console.error("AVPlay prepare error: " + error);
                    if (state.retryCount < 3) {
                        state.retryCount++;
                        setTimeout(function() { self.playVideoUrl(state.currentVideoUrl, true); }, 2000);
                    }
                });
            } catch (e) { console.error("AVPlay open error: ", e); }
        },

        toggleChat: function() {
            var chatContainer = document.getElementById('player-chat-container');
            if (!state.isChatOpen) {
                state.isChatOpen = true;
                chatContainer.classList.remove('hidden');
                if (App.modules.chat) App.modules.chat.connect(state.currentStreamChannel);
                try {
                    webapis.avplay.setDisplayMethod('PLAYER_DISPLAY_MODE_LETTER_BOX');
                    webapis.avplay.setDisplayRect(0, 126, 1470, 827);
                } catch(e) {}
            } else {
                state.isChatOpen = false;
                chatContainer.classList.add('hidden');
                if (App.modules.chat) App.modules.chat.disconnect();
                try {
                    webapis.avplay.setDisplayMethod('PLAYER_DISPLAY_MODE_FULL_SCREEN');
                    webapis.avplay.setDisplayRect(0, 0, 1920, 1080);
                } catch(e) {}
            }
        },

        closeNativePlayer: function() {
            state.inPlayer = false;
            if (state.isChatOpen) {
                state.isChatOpen = false;
                var chatContainer = document.getElementById('player-chat-container');
                if (chatContainer) chatContainer.classList.add('hidden');
                if (App.modules.chat) App.modules.chat.disconnect();
            }

            var appContainer = document.getElementById('app-container');
            if (appContainer) appContainer.style.display = 'block';

            try {
                webapis.avplay.stop();
                webapis.avplay.close();
            } catch (e) {}

            document.body.classList.remove('player-active');
            document.documentElement.classList.remove('player-active');
            document.getElementById('player-container').style.display = 'none';
            state.isQualityMenuOpen = false; 
            document.getElementById('quality-menu').style.display = 'none';
            clearTimeout(state.uiTimeout);
            
            App.loader.unload('player');
            
            if (App.previousModule) {
                App.nav.navigateTo(App.previousModule).then(function() {
                    if (App.modules[App.previousModule] && App.modules[App.previousModule].updateSelection) {
                        App.modules[App.previousModule].updateSelection();
                    }
                });
            } else {
                App.nav.inMenu = true;
                App.nav.update();
            }
        },

        showPlayerUI: function() {
            var ui = document.getElementById('player-ui');
            ui.classList.remove('hidden');
            clearTimeout(state.uiTimeout);
            state.uiTimeout = setTimeout(function() {
                if (!state.isQualityMenuOpen) ui.classList.add('hidden');
            }, 4000);
        },

        updatePlayerFocus: function() {
            if (state.isQualityMenuOpen) {
                var items = document.querySelectorAll('.quality-item');
                for (var i = 0; i < items.length; i++) items[i].classList.toggle('focused', i === state.qualityFocusIndex);
                return;
            }
            state.playerBtns.forEach(function(id, i) {
                var btn = document.getElementById(id);
                if (btn) btn.classList.toggle('focused', i === state.playerFocusIndex);
            });
        },

        handleKey: function(e) {
            if (!state.inPlayer) return;
            var ui = document.getElementById('player-ui');
            var isUIHidden = ui.classList.contains('hidden');

            if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
                if (state.isQualityMenuOpen) {
                    state.isQualityMenuOpen = false; document.getElementById('quality-menu').style.display = 'none';
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
                }
                this.updatePlayerFocus(); return;
            }

            if (e.keyCode === 39) { 
                if (state.playerFocusIndex < state.playerBtns.length - 1) {
                    state.playerFocusIndex++;
                    if (state.isClip && state.playerBtns[state.playerFocusIndex] === 'btn-chat') state.playerFocusIndex++;
                }
            }
            if (e.keyCode === 37) { 
                if (state.playerFocusIndex > 0) {
                    state.playerFocusIndex--;
                    if (state.isClip && state.playerBtns[state.playerFocusIndex] === 'btn-chat') state.playerFocusIndex--;
                }
            }
            if (e.keyCode === 13) {
                if (state.playerFocusIndex === 0) {
                    try {
                        if (state.isPlaying) {
                            webapis.avplay.pause();
                            state.isPlaying = false;
                            document.getElementById('icon-pause').style.display = 'none';
                            document.getElementById('icon-play').style.display = 'block';
                        } else {
                            this.playVideoUrl(state.currentVideoUrl);
                        }
                    } catch (e) {}
                } else if (state.playerFocusIndex === 1) {
                    this.toggleChat();
                } else if (state.playerFocusIndex === 2) {
                    var menu = document.getElementById('quality-menu');
                    menu.innerHTML = state.qualityOptions.map(function(q) { return '<div class="quality-item">' + q.name + '</div>'; }).join('');
                    menu.style.display = 'flex'; state.isQualityMenuOpen = true; state.qualityFocusIndex = 0;
                    var items = menu.querySelectorAll('.quality-item');
                    if (items[0]) items[0].classList.add('focused');
                } else if (state.playerFocusIndex === 3) {
                    var ch = state.currentStreamChannel;
                    this.closeNativePlayer();
                    App.nav.navigateTo('channel').then(function() {
                        if (App.modules.channel && App.modules.channel.openChannelView) App.modules.channel.openChannelView(ch);
                    });
                }
            }
            this.updatePlayerFocus();
        },

        destroy: function() { if (state.inPlayer) this.closeNativePlayer(); }
    };
})();