(function() {
    let ws = null;
    let messageQueue = [];
    let isRendering = false;
    let emoteCache = {}; // Cache in RAM for Base64 emotes
    const MAX_NODES = 25;

    App.modules.chat = {
        init: function() {
            // Nothing to do until we open it
        },
        
        load: async function() {}, // Chat doesn't have a dedicated view area like home

        connect: function(channel) {
            if (ws) this.disconnect();
            
            const chatContainer = document.getElementById('player-chat-container');
            if (chatContainer) {
                // Rimuoviamo l'iframe e l'overlay di caricamento, usiamo solo un div nativo
                chatContainer.innerHTML = '<div id="chat-messages" style="display:flex; flex-direction:column; justify-content:flex-end; height:100%; padding: 20px; overflow:hidden; gap: 12px; font-size: 18px; font-family: sans-serif;"></div>';
            }

            ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
            
            ws.onopen = () => {
                ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
                ws.send(`PASS SCHMOOPIIE`);
                ws.send(`NICK justinfan${Math.floor(Math.random() * 80000)}`);
                ws.send(`JOIN #${channel.toLowerCase()}`);
            };

            ws.onmessage = (event) => {
                const lines = event.data.split('\r\n');
                lines.forEach(line => {
                    if (!line) return;
                    if (line.startsWith('PING')) {
                        ws.send('PONG :tmi.twitch.tv');
                    } else if (line.includes('PRIVMSG')) {
                        this.handleMessage(line);
                    }
                });
            };
        },

        handleMessage: function(rawLine) {
            // Estrazione Tags (colori, emotes)
            let tags = {};
            let msgStr = rawLine;
            if (rawLine.startsWith('@')) {
                const splitIdx = rawLine.indexOf(' ');
                const tagsStr = rawLine.substring(1, splitIdx);
                msgStr = rawLine.substring(splitIdx + 1);
                
                tagsStr.split(';').forEach(tag => {
                    const [k, v] = tag.split('=');
                    tags[k] = v;
                });
            }

            // Estrazione Utente e Messaggio
            const prefixEnd = msgStr.indexOf(' ', 1);
            const prefix = msgStr.substring(0, prefixEnd);
            const userMatch = prefix.match(/^:([^!]+)!/);
            const user = userMatch ? userMatch[1] : 'Unknown';
            
            const msgStart = msgStr.indexOf(' :', prefixEnd);
            const text = msgStr.substring(msgStart + 2);

            let color = tags['color'] || '#bf94ff';
            
            messageQueue.push({ user, color, text, emotes: tags['emotes'] });
            this.scheduleRender();
        },

        scheduleRender: function() {
            if (isRendering || messageQueue.length === 0) return;
            isRendering = true;
            
            // requestAnimationFrame accorpa le modifiche grafiche al refresh del display (60hz), annullando il lag
            requestAnimationFrame(async () => {
                const container = document.getElementById('chat-messages');
                if (!container) {
                    messageQueue = [];
                    isRendering = false;
                    return;
                }

                // DocumentFragment: Creiamo i nodi in memoria e li inseriamo tutti in una volta
                const fragment = document.createDocumentFragment();
                const messagesToRender = messageQueue.splice(0, 10); // Batch limit per non bloccare il thread
                
                for (const msg of messagesToRender) {
                    const div = document.createElement('div');
                    div.style.lineHeight = '1.5';
                    div.style.wordWrap = 'break-word';
                    
                    let formattedText = this.escapeHtml(msg.text);
                    formattedText = await this.parseEmotes(formattedText, msg.emotes);

                    div.innerHTML = `<span style="color:${msg.color}; font-weight:bold;">${msg.user}</span> <span style="color:#efeff1;">${formattedText}</span>`;
                    fragment.appendChild(div);
                }

                container.appendChild(fragment);

                // Blocco rigido della memoria DOM
                while (container.childNodes.length > MAX_NODES) {
                    container.removeChild(container.firstChild);
                }

                isRendering = false;
                if (messageQueue.length > 0) this.scheduleRender();
            });
        },

        escapeHtml: function(unsafe) {
            return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        },

        parseEmotes: async function(text, emotesStr) {
            if (!emotesStr) return text;
            // Esempio: 25:0-4,12-16/1902:6-10
            const emotes = [];
            emotesStr.split('/').forEach(emote => {
                const [id, positions] = emote.split(':');
                if (!positions) return;
                positions.split(',').forEach(pos => {
                    const [start, end] = pos.split('-');
                    emotes.push({ id, start: parseInt(start), end: parseInt(end) });
                });
            });
            
            // Ordina al contrario per rimpiazzare senza sballare gli indici
            emotes.sort((a, b) => b.start - a.start);
            
            let res = text;
            for (const emote of emotes) {
                const b64 = await this.getEmoteBase64(emote.id);
                const imgTag = `<img src="${b64}" style="vertical-align: middle; height: 28px; margin: -5px 0;">`;
                res = res.substring(0, emote.start) + imgTag + res.substring(emote.end + 1);
            }
            return res;
        },

        getEmoteBase64: async function(id) {
            // Caching RAM Extrema: Se abbiamo già l'immagine Base64, restituiamola subito senza usare la rete
            if (emoteCache[id]) return emoteCache[id];
            
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        const dataURL = canvas.toDataURL('image/png'); // Codifica in stringa pura
                        emoteCache[id] = dataURL; 
                        resolve(dataURL);
                    } catch(e) {
                        // Fallback se la policy CORS blocca l'estrazione su TV
                        resolve(`https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/1.0`); 
                    }
                };
                img.onerror = () => resolve(`https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/1.0`);
                img.src = `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/1.0`;
            });
        },

        disconnect: function() {
            if (ws) {
                ws.close();
                ws = null;
            }
            messageQueue = [];
            const container = document.getElementById('player-chat-container');
            if (container) container.innerHTML = '';
        },

        destroy: function() {
            this.disconnect();
        }
    };
})();