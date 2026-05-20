(function() {
    var ws = null;
    var messageQueue = [];
    var isRendering = false;
    var emoteCache = {}; 
    var MAX_NODES = 25;

    App.modules.chat = {
        init: function() {},
        
        load: function() { return Promise.resolve(); }, 

        connect: function(channel) {
            var self = this;
            if (ws) this.disconnect();
            
            var chatContainer = document.getElementById('player-chat-container');
            if (chatContainer) {
                chatContainer.innerHTML = '<div id="chat-messages" style="display:flex; flex-direction:column; justify-content:flex-end; height:100%; padding: 20px; overflow:hidden; gap: 12px; font-size: 18px; font-family: sans-serif;"></div>';
            }

            ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
            
            ws.onopen = function() {
                ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
                ws.send('PASS SCHMOOPIIE');
                ws.send('NICK justinfan' + Math.floor(Math.random() * 80000));
                ws.send('JOIN #' + channel.toLowerCase());
            };

            ws.onmessage = function(event) {
                var lines = event.data.split('\r\n');
                lines.forEach(function(line) {
                    if (!line) return;
                    if (line.indexOf('PING') === 0) {
                        ws.send('PONG :tmi.twitch.tv');
                    } else if (line.indexOf('PRIVMSG') !== -1) {
                        self.handleMessage(line);
                    }
                });
            };
        },

        handleMessage: function(rawLine) {
            var tags = {};
            var msgStr = rawLine;
            if (rawLine.indexOf('@') === 0) {
                var splitIdx = rawLine.indexOf(' ');
                var tagsStr = rawLine.substring(1, splitIdx);
                msgStr = rawLine.substring(splitIdx + 1);
                
                var tagParts = tagsStr.split(';');
                tagParts.forEach(function(tag) {
                    var kv = tag.split('=');
                    tags[kv[0]] = kv[1];
                });
            }

            var prefixEnd = msgStr.indexOf(' ', 1);
            var prefix = msgStr.substring(0, prefixEnd);
            var userMatch = prefix.match(/^:([^!]+)!/);
            var user = userMatch ? userMatch[1] : 'Unknown';
            
            var msgStart = msgStr.indexOf(' :', prefixEnd);
            var text = msgStr.substring(msgStart + 2);

            var color = tags['color'] || '#bf94ff';
            
            messageQueue.push({ user: user, color: color, text: text, emotes: tags['emotes'] });
            this.scheduleRender();
        },

        scheduleRender: function() {
            var self = this;
            if (isRendering || messageQueue.length === 0) return;
            isRendering = true;
            
            setTimeout(function() {
                var container = document.getElementById('chat-messages');
                if (!container) {
                    messageQueue = [];
                    isRendering = false;
                    return;
                }

                var messagesToRender = messageQueue.splice(0, 10);
                
                var processNext = function(idx) {
                    if (idx >= messagesToRender.length) {
                        while (container.childNodes.length > MAX_NODES) {
                            container.removeChild(container.firstChild);
                        }
                        isRendering = false;
                        if (messageQueue.length > 0) self.scheduleRender();
                        return;
                    }

                    var msg = messagesToRender[idx];
                    var div = document.createElement('div');
                    div.style.lineHeight = '1.5';
                    div.style.wordWrap = 'break-word';
                    div.style.marginBottom = '4px';
                    
                    var formattedText = self.escapeHtml(msg.text);
                    self.parseEmotes(formattedText, msg.emotes).then(function(res) {
                        div.innerHTML = '<span style="color:' + msg.color + '; font-weight:bold;">' + msg.user + ':</span> <span style="color:#efeff1;">' + res + '</span>';
                        container.appendChild(div);
                        processNext(idx + 1);
                    }).catch(function() {
                        div.innerHTML = '<span style="color:' + msg.color + '; font-weight:bold;">' + msg.user + ':</span> <span style="color:#efeff1;">' + formattedText + '</span>';
                        container.appendChild(div);
                        processNext(idx + 1);
                    });
                };

                processNext(0);
            }, 50);
        },

        escapeHtml: function(unsafe) {
            return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        },

        parseEmotes: function(text, emotesStr) {
            var self = this;
            if (!emotesStr) return Promise.resolve(text);
            var emotes = [];
            emotesStr.split('/').forEach(function(emote) {
                var parts = emote.split(':');
                var id = parts[0];
                var positions = parts[1];
                if (!positions) return;
                positions.split(',').forEach(function(pos) {
                    var range = pos.split('-');
                    emotes.push({ id: id, start: parseInt(range[0]), end: parseInt(range[1]) });
                });
            });
            
            emotes.sort(function(a, b) { return b.start - a.start; });
            
            var res = text;
            var promise = Promise.resolve();

            var applyNext = function(idx) {
                if (idx >= emotes.length) return Promise.resolve(res);
                var emote = emotes[idx];
                return self.getEmoteBase64(emote.id).then(function(b64) {
                    var imgTag = '<img src="' + b64 + '" style="vertical-align: middle; height: 28px; margin: -5px 0;">';
                    res = res.substring(0, emote.start) + imgTag + res.substring(emote.end + 1);
                    return applyNext(idx + 1);
                });
            };

            return applyNext(0);
        },

        getEmoteBase64: function(id) {
            if (emoteCache[id]) return Promise.resolve(emoteCache[id]);
            
            return new Promise(function(resolve) {
                var img = new Image();
                img.crossOrigin = 'Anonymous';
                img.onload = function() {
                    try {
                        var canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        var ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        var dataURL = canvas.toDataURL('image/png');
                        emoteCache[id] = dataURL; 
                        resolve(dataURL);
                    } catch(e) {
                        resolve('https://static-cdn.jtvnw.net/emoticons/v2/' + id + '/default/dark/1.0'); 
                    }
                };
                img.onerror = function() { resolve('https://static-cdn.jtvnw.net/emoticons/v2/' + id + '/default/dark/1.0'); };
                img.src = 'https://static-cdn.jtvnw.net/emoticons/v2/' + id + '/default/dark/1.0';
            });
        },

        disconnect: function() {
            if (ws) {
                ws.close();
                ws = null;
            }
            messageQueue = [];
            var container = document.getElementById('player-chat-container');
            if (container) container.innerHTML = '';
        },

        destroy: function() {
            this.disconnect();
        }
    };
})();