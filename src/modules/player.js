(function() {
    let state = {
        inPlayer: false,
        uiTimeout: null,
        playerFocusIndex: 0, // 0: Play, 1: Chat, 2: Quality, 3: Channel
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
        retryCount: 0
    };

    App.modules.player = {
        init: function() {
            // Player doesn't need heavy initial state reset like others since it re-initializes on open
        },

        load: async function() {
            // Usually player is triggered via openNativePlayer, not directly via nav
        },

        getStreamM3u8: async function(channel) {
            try {
                // 1. Usa il client-id pubblico Web di Twitch per bypassare blocchi OAuth sullo streaming
                const gqlBody = {
                    operationName: 'PlaybackAccessToken_Template',
                    query: `query PlaybackAccessToken_Template($login: String!, $playerType: String!) {  streamPlaybackAccessToken(channelName: $login, params: {platform: "web", playerBackend: "mediaplayer", playerType: $playerType}) { value signature } }`,
                    variables: { login: channel, playerType: 'site' }
                };

                let headers = { 'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko', 'Content-Type': 'application/json' };

                const tokenRes = await fetch('https://gql.twitch.tv/gql', {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(gqlBody)
                });
                
                const tokenData = await tokenRes.json();
                
                if (tokenData.errors && tokenData.errors.length > 0) {
                    throw new Error("GQL Error: " + tokenData.errors[0].message);
                }

                if (!tokenData.data || !tokenData.data.streamPlaybackAccessToken) {
                    throw new Error("No token in GQL response");
                }

                const { value, signature } = tokenData.data.streamPlaybackAccessToken;

                // 2. Componi e Leggi il file M3U8 Master da Usher
                const originalUsherUrl = `https://usher.ttvnw.net/api/channel/hls/${channel}.m3u8?allow_source=true&sig=${signature}&token=${encodeURIComponent(value)}&reassignments_supported=true&playlist_include_framerate=true&p=${Math.random()}`;
                let m3u8Url = originalUsherUrl;
                
                // --- AD BLOCK LOGIC CON FALLBACK ---
                let m3u8Res;
                if (App.settings.adBlock) {
                    try {
                        const proxyUrl = `https://lb-eu.cdn-perfprod.com/live/${channel}?allow_source=true&sig=${signature}&token=${encodeURIComponent(value)}&reassignments_supported=true&playlist_include_framerate=true`;
                        m3u8Res = await fetch(proxyUrl);
                        if (!m3u8Res.ok) {
                            console.warn(`Ad-Block Proxy returned ${m3u8Res.status}, falling back...`);
                            m3u8Res = await fetch(originalUsherUrl);
                        }
                    } catch (proxyErr) {
                        console.warn("Ad-Block Proxy fetch failed, falling back to Usher:", proxyErr);
                        m3u8Res = await fetch(originalUsherUrl);
                    }
                } else {
                    m3u8Res = await fetch(originalUsherUrl);
                }
                
                if (!m3u8Res.ok) {
                    throw new Error(`Usher HTTP ${m3u8Res.status}`);
                }
                
                const m3u8Text = await m3u8Res.text();

                // 3. Estrai le varianti (Risoluzioni)
                const lines = m3u8Text.split('\n');
                const streams = [{ name: 'Auto', url: m3u8Url }];
                let currentName = null;
                let mediaMap = {};

                lines.forEach(line => {
                    if (line.startsWith('#EXT-X-MEDIA:TYPE=VIDEO')) {
                        const groupIdMatch = line.match(/GROUP-ID="([^"]+)"/);
                        const nameMatch = line.match(/NAME="([^"]+)"/);
                        if (groupIdMatch && nameMatch) {
                            let cleanName = nameMatch[1].replace(/\(source\)/gi, '').trim();
                            mediaMap[groupIdMatch[1]] = cleanName;
                        }
                    }
                });

                lines.forEach(line => {
                    if (line.startsWith('#EXT-X-STREAM-INF')) {
                        const videoMatch = line.match(/VIDEO="([^"]+)"/);
                        const groupId = videoMatch ? videoMatch[1] : null;
                        currentName = groupId && mediaMap[groupId] ? mediaMap[groupId] : (groupId || 'Unknown');
                    } else if (line.startsWith('http') && currentName) {
                        streams.push({ name: currentName, url: line });
                        currentName = null;
                    }
                });

                const autoOption = streams[0];
                const otherOptions = streams.slice(1);
                
                otherOptions.sort((a, b) => {
                    const getRes = (s) => {
                        const m = s.name.match(/(\d+)p/);
                        return m ? parseInt(m[1]) : 0;
                    };
                    return getRes(b) - getRes(a);
                });

                return [autoOption, ...otherOptions];
            } catch (e) {
                console.error("getStreamM3u8 error:", e);
                return { error: e.message };
            }
        },

        openNativePlayer: async function(channelName, channelId, streamTitle) {
            state.inPlayer = true;
            state.playerFocusIndex = 0; 
            App.nav.inMenu = false;

            const appContainer = document.getElementById('app-container');
            if (appContainer) appContainer.style.display = 'none';

            state.currentStreamChannel = channelName;
            state.currentStreamId = channelId;
            state.currentStreamTitle = streamTitle || "";

            const titleEl = document.getElementById('player-live-title');
            if (titleEl) titleEl.innerText = state.currentStreamTitle;
            
            let existingPlayer = document.getElementById('av-player');
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

            state.qualityOptions = await this.getStreamM3u8(channelName);
            
            if (state.qualityOptions && state.qualityOptions.error) {
                alert("Fetch Error: " + state.qualityOptions.error);
                this.closeNativePlayer(); return;
            }
            
            if (!state.qualityOptions || state.qualityOptions.length === 0) {
                alert("Error: Unable to fetch video stream for " + channelName);
                this.closeNativePlayer(); return;
            }

            try {
                const defaultQualityUrl = state.qualityOptions.length > 1 ? state.qualityOptions[1].url : state.qualityOptions[0].url;
                this.playVideoUrl(defaultQualityUrl);
            } catch (err) {
                alert("Error starting video: " + err.message);
                this.closeNativePlayer();
            }

            this.showPlayerUI();
            this.updatePlayerFocus();
        },

        playVideoUrl: function(url, isRetry = false) {
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
                } catch (bufErr) {
                    console.warn("Impossibile impostare i parametri di buffering:", bufErr);
                }

                var listener = {
                    onbufferingstart: () => {
                        console.log("Buffering start.");
                        clearTimeout(state.bufferingWatchdog);
                        state.bufferingWatchdog = setTimeout(() => {
                            console.warn("Watchdog: Buffering prolungato (>15s). Riavvio stream.");
                            if (state.retryCount < 3) {
                                state.retryCount++;
                                this.playVideoUrl(state.currentVideoUrl, true);
                            }
                        }, 15000);
                    },
                    onbufferingprogress: (percent) => { },
                    onbufferingcomplete: () => {
                        console.log("Buffering complete.");
                        clearTimeout(state.bufferingWatchdog);
                    },
                    onstreamcompleted: () => {
                        console.log("Stream Completed");
                        try { webapis.avplay.stop(); } catch(e){}
                    },
                    oncurrentplaytime: (currentTime) => {
                        clearTimeout(state.bufferingWatchdog);
                    },
                    onerror: (eventType) => {
                        console.log("event type error : " + eventType);
                        clearTimeout(state.bufferingWatchdog);
                        if (state.retryCount < 3) {
                            console.warn("AVPlay onerror: tento il riavvio.");
                            state.retryCount++;
                            setTimeout(() => { this.playVideoUrl(state.currentVideoUrl, true); }, 2000);
                        }
                    },
                    ondrmevent: (drmEvent, drmData) => { },
                    onsubtitlechange: (duration, text, data3, data4) => { }
                };

                webapis.avplay.setListener(listener);
                webapis.avplay.setDisplayMethod(state.isChatOpen ? 'PLAYER_DISPLAY_MODE_LETTER_BOX' : 'PLAYER_DISPLAY_MODE_FULL_SCREEN');

                webapis.avplay.prepareAsync(() => {
                    if (state.isChatOpen) {
                        try { webapis.avplay.setDisplayRect(0, 126, 1470, 827); } catch(e) {}
                    } else {
                        try { webapis.avplay.setDisplayRect(0, 0, 1920, 1080); } catch(e) {}
                    }
                    webapis.avplay.play();
                    state.isPlaying = true;
                    document.getElementById('icon-pause').style.display = 'block';
                    document.getElementById('icon-play').style.display = 'none';
                }, (error) => {
                    console.error("AVPlay prepare error: " + error);
                    clearTimeout(state.bufferingWatchdog);
                    if (state.retryCount < 3) {
                        state.retryCount++;
                        setTimeout(() => { this.playVideoUrl(state.currentVideoUrl, true); }, 2000);
                    }
                });
            } catch (e) {
                console.error("AVPlay open error: ", e);
            }
        },

        toggleChat: function() {
            const chatContainer = document.getElementById('player-chat-container');

            if (!state.isChatOpen) {
                state.isChatOpen = true;
                chatContainer.classList.remove('hidden');
                
                if (App.modules.chat) {
                    App.modules.chat.connect(state.currentStreamChannel);
                }

                try {
                    webapis.avplay.setDisplayMethod('PLAYER_DISPLAY_MODE_LETTER_BOX');
                    webapis.avplay.setDisplayRect(0, 126, 1470, 827);
                } catch(e) { console.error("Error resizing video", e); }
            } else {
                state.isChatOpen = false;
                chatContainer.classList.add('hidden');
                
                if (App.modules.chat) {
                    App.modules.chat.disconnect();
                }
                
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
                const chatContainer = document.getElementById('player-chat-container');
                if (chatContainer) chatContainer.classList.add('hidden');
                if (App.modules.chat) App.modules.chat.disconnect();
            }

            const appContainer = document.getElementById('app-container');
            if (appContainer) appContainer.style.display = 'block';

            try {
                webapis.avplay.stop();
                webapis.avplay.close();
            } catch (e) { console.error('AVPlay close error', e); }

            document.body.classList.remove('player-active');
            document.documentElement.classList.remove('player-active');
            document.getElementById('player-container').style.display = 'none';
            state.isQualityMenuOpen = false; 
            document.getElementById('quality-menu').style.display = 'none';
            clearTimeout(state.uiTimeout);
            
            App.loader.unload('player');
            
            // Ripristino intelligente dalla cache:
            if (App.previousModule) {
                App.nav.inMenu = false;
                App.nav.navigateTo(App.previousModule).then(() => {
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
            const ui = document.getElementById('player-ui');
            ui.classList.remove('hidden');
            clearTimeout(state.uiTimeout);
            state.uiTimeout = setTimeout(() => {
                if (!state.isQualityMenuOpen) ui.classList.add('hidden');
            }, 4000);
        },

        updatePlayerFocus: function() {
            if (state.isQualityMenuOpen) {
                document.querySelectorAll('.quality-item').forEach((el, i) => {
                    el.classList.toggle('focused', i === state.qualityFocusIndex);
                });
                return;
            }
            state.playerBtns.forEach((id, i) => document.getElementById(id).classList.toggle('focused', i === state.playerFocusIndex));
        },

        handleKey: function(e) {
            if (!state.inPlayer) return;

            const ui = document.getElementById('player-ui');
            const isUIHidden = ui.classList.contains('hidden');

            if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
                if (state.isQualityMenuOpen) {
                    state.isQualityMenuOpen = false; document.getElementById('quality-menu').style.display = 'none';
                    this.showPlayerUI(); this.updatePlayerFocus();
                } else {
                    this.closeNativePlayer();
                }
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

            if (e.keyCode === 39 && state.playerFocusIndex < state.playerBtns.length - 1) state.playerFocusIndex++;
            if (e.keyCode === 37 && state.playerFocusIndex > 0) state.playerFocusIndex--;
            if (e.keyCode === 13) {
                if (state.playerFocusIndex === 0) {
                    try {
                        if (state.isPlaying) {
                            webapis.avplay.pause();
                            state.isPlaying = false;
                            document.getElementById('icon-pause').style.display = 'none';
                            document.getElementById('icon-play').style.display = 'block';
                        } else {
                            // Resume: Riavvia lo stream dall'URL corrente per rimettersi in sincro con la live
                            console.log("Resuming: Restarting stream to jump to live edge.");
                            this.playVideoUrl(state.currentVideoUrl);
                        }
                    } catch (e) { console.error('AVPlay play/pause error', e); }
                } else if (state.playerFocusIndex === 1) {
                    this.toggleChat();
                } else if (state.playerFocusIndex === 2) {
                    const menu = document.getElementById('quality-menu');
                    menu.innerHTML = state.qualityOptions.map((q, i) => `<div class="quality-item ${i === 0 ? 'focused' : ''}">${q.name}</div>`).join('');
                    menu.style.display = 'flex'; state.isQualityMenuOpen = true; state.qualityFocusIndex = 0;
                } else if (state.playerFocusIndex === 3) {
                    const channelToOpen = state.currentStreamChannel;
                    this.closeNativePlayer();
                    App.nav.navigateTo('channel').then(() => {
                        if (App.modules.channel && App.modules.channel.openChannelView) {
                            App.modules.channel.openChannelView(channelToOpen);
                        }
                    });
                }
            }
            this.updatePlayerFocus();
        },

        destroy: function() {
            if (state.inPlayer) {
                this.closeNativePlayer();
            }
        }
    };
})();