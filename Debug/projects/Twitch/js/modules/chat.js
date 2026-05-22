(function() {
    var ws = null;
    var messageQueue = [];
    var isRendering = false;
    var MAX_NODES = 30;

    App.modules.chat = {
        init: function() {},
        
        load: function() { return Promise.resolve(); }, 

        connect: function(channel) {
            var self = this;
            if (ws) this.disconnect();
            
            var chatContainer = document.getElementById('player-chat-container');
            if (chatContainer) {
                chatContainer.innerHTML = '<div id="chat-messages" style="position:absolute; bottom:0; left:0; right:0; top:0; padding:20px; overflow:hidden; font-size:18px; font-family:sans-serif; color:#efeff1;"></div>';
            }

            ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
            
            ws.onopen = function() {
                ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
                // Use actual user token if available, otherwise anonymous
                if (App.auth && App.auth.token) {
                    ws.send('PASS oauth:' + App.auth.token);
                    // Use a valid nick for authenticated
                    var nick = 'justinfan' + Math.floor(Math.random() * 80000);
                    ws.send('NICK ' + nick);
                } else {
                    ws.send('PASS SCHMOOPIIE');
                    ws.send('NICK justinfan' + Math.floor(Math.random() * 80000));
                }
                ws.send('JOIN #' + channel.toLowerCase());
            };

            ws.onmessage = function(event) {
                var lines = event.data.split('\r\n');
                for (var li = 0; li < lines.length; li++) {
                    var line = lines[li];
                    if (!line) continue;
                    if (line.indexOf('PING') === 0) {
                        ws.send('PONG :tmi.twitch.tv');
                    } else if (line.indexOf('PRIVMSG') !== -1) {
                        self.handleMessage(line);
                    }
                }
            };

            ws.onerror = function(err) {
                console.error('Chat WebSocket error:', err);
            };
        },

        handleMessage: function(rawLine) {
            var tags = {};
            var msgStr = rawLine;
            if (rawLine.charAt(0) === '@') {
                var splitIdx = rawLine.indexOf(' ');
                var tagsStr = rawLine.substring(1, splitIdx);
                msgStr = rawLine.substring(splitIdx + 1);
                
                var tagParts = tagsStr.split(';');
                for (var t = 0; t < tagParts.length; t++) {
                    var kv = tagParts[t].split('=');
                    tags[kv[0]] = kv[1] || '';
                }
            }

            var prefixEnd = msgStr.indexOf(' ', 1);
            var prefix = msgStr.substring(0, prefixEnd);
            var userMatch = prefix.match(/^:([^!]+)!/);
            var user = userMatch ? userMatch[1] : 'Unknown';
            
            var msgStart = msgStr.indexOf(' :', prefixEnd);
            if (msgStart === -1) return;
            var text = msgStr.substring(msgStart + 2);

            var color = tags['color'] || '#bf94ff';
            
            messageQueue.push({ user: user, color: color, text: text, emotes: tags['emotes'] || '' });
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

                var messagesToRender = messageQueue.splice(0, 5);
                
                for (var m = 0; m < messagesToRender.length; m++) {
                    var msg = messagesToRender[m];
                    var div = document.createElement('div');
                    div.style.lineHeight = '1.5';
                    div.style.wordWrap = 'break-word';
                    div.style.marginBottom = '10px';
                    
                    var safeText = self.escapeHtml(msg.text);
                    var rendered = self.renderEmotes(safeText, msg.emotes);
                    
                    div.innerHTML = '<span style="color:' + msg.color + '; font-weight:bold;">' + self.escapeHtml(msg.user) + ':</span> <span style="color:#efeff1;">' + rendered + '</span>';
                    container.appendChild(div);
                }

                // Remove old messages
                while (container.childNodes.length > MAX_NODES) {
                    container.removeChild(container.firstChild);
                }

                // Scroll to bottom: move all messages up by repositioning
                // Simple approach: keep only last N messages visible, aligned to bottom
                self.scrollToBottom(container);

                isRendering = false;
                if (messageQueue.length > 0) self.scheduleRender();
            }, 80);
        },

        scrollToBottom: function(container) {
            // Force scroll to bottom
            container.scrollTop = container.scrollHeight;
            // Fallback: set overflow-y to auto temporarily
            container.style.overflowY = 'auto';
            container.scrollTop = container.scrollHeight;
            container.style.overflowY = 'hidden';
        },

        escapeHtml: function(unsafe) {
            if (!unsafe) return '';
            return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        },

        renderEmotes: function(text, emotesStr) {
            if (!emotesStr) return text;
            try {
                var emotes = [];
                var emoteParts = emotesStr.split('/');
                for (var e = 0; e < emoteParts.length; e++) {
                    var parts = emoteParts[e].split(':');
                    var id = parts[0];
                    var positions = parts[1];
                    if (!positions) continue;
                    var posList = positions.split(',');
                    for (var p = 0; p < posList.length; p++) {
                        var range = posList[p].split('-');
                        emotes.push({ id: id, start: parseInt(range[0]), end: parseInt(range[1]) });
                    }
                }
                
                emotes.sort(function(a, b) { return b.start - a.start; });
                
                var result = text;
                for (var i = 0; i < emotes.length; i++) {
                    var emote = emotes[i];
                    var imgTag = '<img src="https://static-cdn.jtvnw.net/emoticons/v2/' + emote.id + '/default/dark/1.0" style="vertical-align:middle; height:28px; margin:-3px 2px;">';
                    result = result.substring(0, emote.start) + imgTag + result.substring(emote.end + 1);
                }
                return result;
            } catch(ex) {
                return text;
            }
        },

        disconnect: function() {
            if (ws) {
                try { ws.close(); } catch(e) {}
                ws = null;
            }
            messageQueue = [];
            isRendering = false;
            var container = document.getElementById('player-chat-container');
            if (container) container.innerHTML = '';
        },

        destroy: function() {
            this.disconnect();
        }
    };
})();