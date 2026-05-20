(function() {
    var state = {
        dataRows: [],
        activeRow: 0,
        activeCol: 0,
        seqId: 0
    };

    App.modules.follow = {
        init: function() {
            state = {
                dataRows: [],
                activeRow: 0,
                activeCol: 0,
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
            if (!App.auth.token) {
                this.render();
                return Promise.resolve();
            }
            
            return App.api.twitchFetch('https://api.twitch.tv/helix/streams/followed?user_id=' + App.auth.userId + '&first=100', {}, 30)
                .then(function(folRes) {
                    var streams = folRes.data || [];
                    var liveUsers = [];
                    
                    var processNext = function() {
                        for (var i = 0; i < streams.length; i += 3) {
                            state.dataRows.push({ type: "stream", data: streams.slice(i, i + 3) });
                        }
                        if (state.dataRows.length === 0) {
                            state.dataRows.push({ type: "empty", data: [{}] });
                        }
                        if (liveUsers.length > 0) {
                            state.dataRows.push({ type: "avatars", data: liveUsers });
                        }

                        if (mySeq !== state.seqId) return;
                        self.render();
                    };

                    if (streams.length > 0 && App.settings.showFollowedAvatars) {
                        var userIds = streams.map(function(s) { return 'id=' + s.user_id; }).join('&');
                        return App.api.twitchFetch('https://api.twitch.tv/helix/users?' + userIds, {}, 60)
                            .then(function(userRes) {
                                if (userRes && userRes.data) liveUsers = userRes.data;
                                processNext();
                            })
                            .catch(function(e) { 
                                console.error("Error fetching live users for follow", e); 
                                processNext();
                            });
                    } else {
                        processNext();
                    }
                })
                .catch(function(e) {
                    console.error(e);
                    var va = document.getElementById('main-view-area');
                    if (va) va.innerHTML = '<div style="color:red; text-align:center; padding-top:100px;">Loading error.</div>';
                });
        },

        render: function() {
            var viewArea = document.getElementById('main-view-area');
            if (!viewArea) return;

            var html = '<div id="follow-view" style="padding-top:20px; padding-bottom:60px; display:flex; flex-direction:column; align-items:center;">';
            state.dataRows.forEach(function(row, rowIndex) {
                if (row.type === 'empty') {
                    html += '<div style="color:white; font-size:30px; margin-top:100px;">' + App.t('no_live') + '</div>';
                } else if (row.type === 'stream') {
                    html += '<div id="follow-row-' + rowIndex + '" class="channel-grid" style="justify-content:center; width: 100%; max-width: 1920px; margin-bottom: 30px;">';
                    row.data.forEach(function(item, colIndex) {
                        var thumb = App.utils.getSafeThumb(item.thumbnail_url, 'stream');
                        var viewers = App.utils.formatViewers(item.viewer_count);
                        html += '<div id="follow-card-' + rowIndex + '-' + colIndex + '" class="channel-card" style="margin: 0 15px;">' +
                                '<div class="badge-live">LIVE</div>' +
                                '<div class="badge-viewers">' + viewers + '</div>' +
                                '<img src="' + thumb + '" loading="lazy" onerror="this.src=\'icon.png\'" style="width:100%; height:100%; object-fit:cover;">' +
                                '<div class="card-info">' +
                                    '<div style="font-size:22px; font-weight:bold; color:white;">' + item.user_name + '</div>' +
                                    '<div style="font-size:16px; color:#adadb8; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + item.title + '</div>' +
                                '</div>' +
                            '</div>';
                    });
                    html += '</div>';
                } else if (row.type === 'avatars') {
                    if (App.settings.showFollowedAvatars) {
                        html += '<div class="live-avatars-bar" id="follow-row-' + rowIndex + '" style="justify-content: center; gap: 20px;">';
                        row.data.forEach(function(item, colIndex) {
                            html += '<img src="' + item.profile_image_url + '" id="follow-card-' + rowIndex + '-' + colIndex + '" class="live-avatar-small" style="margin: 0;" />';
                        });
                        html += '</div>';
                    }
                }
            });

            html += '</div>';
            viewArea.innerHTML = html;
            this.updateSelection();
        },

        updateSelection: function() {
            if (state.dataRows.length === 0) return;
            var currentRowData = state.dataRows[state.activeRow];

            var cards = document.querySelectorAll('#follow-view .channel-card, #follow-view .live-avatar-small');
            for (var i = 0; i < cards.length; i++) cards[i].classList.remove('selected');

            if (!App.nav.inMenu && currentRowData && (currentRowData.type === 'stream' || currentRowData.type === 'avatars')) {
                var card = document.getElementById('follow-card-' + state.activeRow + '-' + state.activeCol);
                if (card) {
                    card.classList.add('selected');
                }
                if (currentRowData.type === 'stream') {
                    var rowEl = document.getElementById('follow-row-' + state.activeRow);
                    if (rowEl) rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                }
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        },

        onMenuExit: function() {
            this.updateSelection();
        },

        handleKey: function(e) {
            if (state.dataRows.length === 0) return;
            var currentRowData = state.dataRows[state.activeRow];
            
            if (currentRowData.type === 'empty') {
                if (e.keyCode === 38) { 
                    App.nav.inMenu = true; 
                    App.nav.update(); 
                    this.updateSelection(); 
                }
                return;
            }
            if (e.keyCode === 39) {
                if (state.activeCol < currentRowData.data.length - 1) state.activeCol++;
                this.updateSelection();
            } else if (e.keyCode === 37) {
                if (state.activeCol > 0) state.activeCol--;
                this.updateSelection();
            } else if (e.keyCode === 40) {
                if (state.activeRow < state.dataRows.length - 1) {
                    state.activeRow++;
                    state.activeCol = 0;
                    this.updateSelection();
                }
            } else if (e.keyCode === 38) {
                if (state.activeRow > 0) {
                    state.activeRow--;
                    state.activeCol = 0;
                    this.updateSelection();
                } else {
                    App.nav.inMenu = true;
                    App.nav.update();
                    this.updateSelection();
                }
            } else if (e.keyCode === 13) {
                if (currentRowData.type === 'stream') {
                    var stream = currentRowData.data[state.activeCol];
                    App.nav.navigateTo('player').then(function() {
                        App.modules.player.openNativePlayer(stream.user_login || stream.user_name, stream.user_id, stream.title);
                    });
                } else if (currentRowData.type === 'avatars') {
                    var user = currentRowData.data[state.activeCol];
                    App.nav.navigateTo('player').then(function() {
                        App.modules.player.openNativePlayer(user.login || user.display_name, user.id, '');
                    });
                }
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