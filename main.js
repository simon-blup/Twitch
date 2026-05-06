const CLIENT_ID = '9g8h4ha9stbc9r76624evvlx4bzk39';
let userToken = localStorage.getItem('twitch_access_token') || '';
let refreshToken = localStorage.getItem('twitch_refresh_token') || '';
let userId = localStorage.getItem('twitch_user_id') || '';

// Default barPos is 'center'
let appSettings = JSON.parse(localStorage.getItem('twitch_settings')) || { barPos: 'center', theme: 'dark' };

let currentFocusIndex = 1; // 0: Search, 1: Home, 2: Settings, 3: Profile
let inMenu = true;
let homeDataRows = [];
let activeRow = 0;
let colIndices = [];
let originalHeroCount = 0; // Per gestire il loop infinito della prima riga

// Per gestire i Settings
let settingsRow = 0;
let settingsCol = [0, 0];

// Per gestire Follow
let followDataRows = [];
let followActiveRow = 0;
let followActiveCol = 0;

window.onload = async function () {
    applySettings();
    if (userToken) {
        // Proviamo a rinfrescare il token all'avvio per assicurarci che sia valido
        await validateOrRefreshToken();
        if (!userId) await fetchUserId();
    }
    updateNav();
    loadContent();
    document.addEventListener('keydown', handleKeydown);
};

async function validateOrRefreshToken() {
    if (!refreshToken) return;
    try {
        const refreshRes = await fetch('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `client_id=${CLIENT_ID}&grant_type=refresh_token&refresh_token=${refreshToken}`
        });
        const refreshData = await refreshRes.json();
        if (refreshData.access_token) {
            userToken = refreshData.access_token;
            if (refreshData.refresh_token) refreshToken = refreshData.refresh_token;
            localStorage.setItem('twitch_access_token', userToken);
            localStorage.setItem('twitch_refresh_token', refreshToken);
        }
    } catch(e) { console.error("Refresh failed", e); }
}

function applySettings() {
    const topbarMenu = document.getElementById('main-menu');
    if (appSettings.barPos === 'center') {
        topbarMenu.style.justifyContent = 'center';
    } else {
        topbarMenu.style.justifyContent = 'flex-start';
    }

    if (appSettings.theme === 'light') {
        document.body.classList.add('theme-light');
    } else {
        document.body.classList.remove('theme-light');
    }
}

function saveSettings() {
    localStorage.setItem('twitch_settings', JSON.stringify(appSettings));
    applySettings();
}

async function fetchUserId() {
    try {
        const res = await twitchFetch('https://api.twitch.tv/helix/users');
        if (res && res.data && res.data[0]) {
            userId = res.data[0].id;
            localStorage.setItem('twitch_user_id', userId);
        }
    } catch (e) { console.error(e); }
}

async function twitchFetch(url, options = {}) {
    if (!options.headers) options.headers = {};
    options.headers['Client-ID'] = CLIENT_ID;
    options.headers['Authorization'] = 'Bearer ' + userToken;

    let res = await fetch(url, options);
    if (res.status === 401 && refreshToken) {
        await validateOrRefreshToken();
        options.headers['Authorization'] = 'Bearer ' + userToken;
        res = await fetch(url, options);
    }
    return res.json();
}

function formatViewers(count) {
    if (count >= 1000000) {
        return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    } else if (count >= 1000) {
        return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return count.toString();
}

async function loadContent() {
    const menuItems = document.querySelectorAll('.menu-item');
    const selectedId = menuItems[currentFocusIndex].id;
    const viewArea = document.getElementById('main-view-area');

    if (viewArea) viewArea.innerHTML = `<div style="text-align:center; padding-top:100px; color:white;">Loading...</div>`;

    if (selectedId === 'menu-home') {
        activeRow = 0;
        await getTwitchHome();
    } else if (selectedId === 'menu-follow') {
        followActiveRow = 0;
        followActiveCol = 0;
        await getFollowData();
    } else if (selectedId === 'menu-settings') {
        settingsRow = 0;
        // 0: Center, 1: Left (invertiti come richiesto)
        settingsCol = [
            appSettings.barPos === 'center' ? 0 : 1,
            appSettings.theme === 'dark' ? 0 : 1
        ];
        showSettingsScreen();
    } else if (selectedId === 'menu-profile') {
        showProfileScreen();
    }
}

async function getTwitchHome() {
    homeDataRows = [];
    try {
        // 1. Recommended (Hero)
        const recRes = await twitchFetch('https://api.twitch.tv/helix/streams?first=10');
        if (recRes.data && recRes.data.length > 0) {
            originalHeroCount = recRes.data.length;
            // Triplichiamo i dati per il loop infinito
            const loopedData = [...recRes.data, ...recRes.data, ...recRes.data];
            homeDataRows.push({ title: "", type: "stream", data: loopedData, isHero: true });
        }

        // 2. Followed or Login Button
        if (userId && userToken) {
            const folRes = await twitchFetch(`https://api.twitch.tv/helix/streams/followed?user_id=${userId}&first=10`);
            if (folRes.data && folRes.data.length > 0) {
                homeDataRows.push({ title: "Channels you follow", type: "stream", data: folRes.data });
            } else {
                homeDataRows.push({ title: "Channels you follow", type: "stream", data: [] });
            }
        } else {
            homeDataRows.push({ title: "", type: "login_btn", data: [{}] });
        }

        // 3. Top Categories
        const catRes = await twitchFetch('https://api.twitch.tv/helix/games/top?first=10');
        if (catRes.data && catRes.data.length > 0) {
            homeDataRows.push({ title: "Categories", type: "category", data: catRes.data });
            const top4 = catRes.data.slice(0, 4);
            for (const cat of top4) {
                const catStreams = await twitchFetch(`https://api.twitch.tv/helix/streams?game_id=${cat.id}&first=10`);
                if (catStreams.data && catStreams.data.length > 0) {
                    catStreams.data.sort((a, b) => b.viewer_count - a.viewer_count);
                    homeDataRows.push({ title: cat.name, type: "stream", data: catStreams.data });
                }
            }
        }

        colIndices = new Array(homeDataRows.length).fill(0);
        if (homeDataRows[0] && homeDataRows[0].isHero) {
            // Partiamo dal set centrale di dati hero
            colIndices[0] = originalHeroCount;
        }
        renderHome();
    } catch (e) {
        console.error("Errore API", e);
        const va = document.getElementById('main-view-area');
        if (va) va.innerHTML = `<div style="color:red; text-align:center; padding-top:100px;">Loading error.</div>`;
    }
}

function renderHome() {
    const viewArea = document.getElementById('main-view-area');
    if (!viewArea) return;
    const isLight = document.body.classList.contains('theme-light');
    const titleColor = isLight ? '#000' : 'white';

    let html = '<div id="home-view" style="padding-bottom:60vh;">';
    homeDataRows.forEach((row, rowIndex) => {
        if (row.title) {
            html += `<h3 style="color:${titleColor}; margin-left:80px; margin-bottom:15px; font-size:26px;">${row.title}</h3>`;
        }
        const gridClass = row.isHero ? 'channel-grid hero-grid' : 'channel-grid';
        html += `
            <div style="width:100%; overflow:visible; perspective:1200px; margin-bottom:40px;">
                <div id="row-${rowIndex}" class="${gridClass}"></div>
            </div>
        `;
    });
    html += '</div>';
    viewArea.innerHTML = html;

    homeDataRows.forEach((row, rowIndex) => {
        const rowDiv = document.getElementById(`row-${rowIndex}`);
        if (!rowDiv) return;

        if (row.type === 'login_btn') {
            rowDiv.style.width = '100%';
            rowDiv.style.height = '60vh';
            rowDiv.style.justifyContent = 'center';
            rowDiv.style.transform = 'none';
            const card = document.createElement('div');
            card.className = 'login-btn';
            card.innerHTML = 'Go to Profile to Log In';
            rowDiv.appendChild(card);
        } else if (row.type === 'category') {
            row.data.forEach((item) => {
                const card = document.createElement('div');
                card.className = 'category-card';
                let thumb = item.box_art_url.replace('{width}', '300').replace('{height}', '400');
                card.innerHTML = `
                    <img src="${thumb}" style="width:100%; height:100%; object-fit:cover;">
                    <div class="card-info"><div style="font-size:20px; font-weight:bold; color:white;">${item.name}</div></div>`;
                rowDiv.appendChild(card);
            });
        } else if (row.type === 'stream') {
            row.data.forEach((item) => {
                const card = document.createElement('div');
                card.className = row.isHero ? 'channel-card hero-card' : 'channel-card';
                let thumb = item.thumbnail_url.replace('{width}', '800').replace('{height}', '450');
                const viewers = formatViewers(item.viewer_count);
                card.innerHTML = `
                    <div class="badge-live">LIVE</div>
                    <div class="badge-viewers">${viewers}</div>
                    <img src="${thumb}" style="width:100%; height:100%; object-fit:cover;">
                    <div class="card-info">
                        <div style="font-size:${row.isHero ? '28' : '22'}px; font-weight:bold; color:white;">${item.user_name}</div>
                        <div style="font-size:${row.isHero ? '18' : '16'}px; color:#adadb8; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.title}</div>
                    </div>`;
                rowDiv.appendChild(card);
            });
        }
    });
    updateHomeSelection();
}

function updateHomeSelection() {
    const centerX = window.innerWidth / 2;
    const gap = 20;

    homeDataRows.forEach((row, rowIndex) => {
        const rowDiv = document.getElementById(`row-${rowIndex}`);
        if (!rowDiv) return;

        const currentColIdx = colIndices[rowIndex];
        const isActiveRow = !inMenu && activeRow === rowIndex;

        if (row.type === 'login_btn') {
            const btn = rowDiv.querySelector('.login-btn');
            if (btn) btn.classList.toggle('focused', isActiveRow);
            return;
        }

        const cards = rowDiv.querySelectorAll(row.type === 'category' ? '.category-card' : '.channel-card');
        cards.forEach((c, i) => {
            c.classList.remove('selected', 'hero-adjacent');
            if (row.isHero) {
                if (isActiveRow && i === currentColIdx) c.classList.add('selected');
                else if (isActiveRow && (i === currentColIdx - 1 || i === currentColIdx + 1)) c.classList.add('hero-adjacent');
            } else {
                c.classList.toggle('selected', isActiveRow && i === currentColIdx);
            }
        });

        if (cards.length > 0) {
            let cardWidth, offset;
            if (row.isHero) {
                cardWidth = 800 + gap;
                offset = centerX - 400 - (currentColIdx * cardWidth);
            } else if (row.type === 'stream') {
                cardWidth = 600 + gap;
                offset = 80 - (currentColIdx * cardWidth);
            } else if (row.type === 'category') {
                cardWidth = 300 + gap;
                offset = 80 - (currentColIdx * cardWidth);
            }
            rowDiv.style.transform = `translateX(${offset}px)`;
        }
    });

    if (!inMenu && activeRow > 0) {
        const rowEl = document.getElementById(`row-${activeRow}`);
        if (rowEl) {
            rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

async function getFollowData() {
    followDataRows = [];
    if (!userToken) {
        followDataRows.push({ type: "login_btn", data: [{}] });
        renderFollowScreen();
        return;
    }
    try {
        const folRes = await twitchFetch(`https://api.twitch.tv/helix/streams/followed?user_id=${userId}&first=100`);
        let streams = folRes.data || [];
        for (let i = 0; i < streams.length; i += 3) {
            followDataRows.push({ type: "stream", data: streams.slice(i, i + 3) });
        }
        if (followDataRows.length === 0) {
            followDataRows.push({ type: "empty", data: [{}] });
        }
        renderFollowScreen();
    } catch (e) {
        console.error(e);
        const va = document.getElementById('main-view-area');
        if (va) va.innerHTML = `<div style="color:red; text-align:center; padding-top:100px;">Loading error.</div>`;
    }
}

function renderFollowScreen() {
    const viewArea = document.getElementById('main-view-area');
    if (!viewArea) return;
    
    let html = '<div id="follow-view" style="padding-bottom:60vh; display:flex; flex-direction:column; align-items:center; gap:40px;">';
    followDataRows.forEach((row, rowIndex) => {
        if (row.type === 'login_btn') {
            html += `
            <div style="display:flex; justify-content:center; align-items:center; height:60vh; width:100%;">
                <div class="login-btn ${!inMenu ? 'focused' : ''}">Go to Profile to Log In</div>
            </div>`;
        } else if (row.type === 'empty') {
            html += `<div style="color:white; font-size:30px; margin-top:100px;">No followed channels are live right now.</div>`;
        } else if (row.type === 'stream') {
            html += `<div id="follow-row-${rowIndex}" class="channel-grid" style="justify-content:center; width: 100%;">`;
            row.data.forEach((item, colIndex) => {
                let thumb = item.thumbnail_url.replace('{width}', '600').replace('{height}', '338');
                const viewers = formatViewers(item.viewer_count);
                html += `
                    <div id="follow-card-${rowIndex}-${colIndex}" class="channel-card">
                        <div class="badge-live">LIVE</div>
                        <div class="badge-viewers">${viewers}</div>
                        <img src="${thumb}" style="width:100%; height:100%; object-fit:cover;">
                        <div class="card-info">
                            <div style="font-size:22px; font-weight:bold; color:white;">${item.user_name}</div>
                            <div style="font-size:16px; color:#adadb8; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.title}</div>
                        </div>
                    </div>`;
            });
            html += `</div>`;
        }
    });
    html += '</div>';
    viewArea.innerHTML = html;
    updateFollowSelection();
}

function updateFollowSelection() {
    if (followDataRows.length === 0) return;
    const currentRowData = followDataRows[followActiveRow];
    
    document.querySelectorAll('#follow-view .channel-card').forEach(c => c.classList.remove('selected'));
    
    if (currentRowData && currentRowData.type === 'login_btn') {
        const btn = document.querySelector('#follow-view .login-btn');
        if (btn) btn.classList.toggle('focused', !inMenu);
        return;
    }

    if (!inMenu && currentRowData && currentRowData.type === 'stream') {
        const card = document.getElementById(`follow-card-${followActiveRow}-${followActiveCol}`);
        if (card) {
            card.classList.add('selected');
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function showSettingsScreen() {
    const viewArea = document.getElementById('main-view-area');
    if (!viewArea) return;
    const textColor = document.body.classList.contains('theme-light') ? '#000' : 'white';

    if (!userToken) {
        viewArea.innerHTML = `
            <div style="display:flex; justify-content:center; align-items:center; height:60vh; width:100%;">
                <div class="login-btn ${!inMenu ? 'focused' : ''}">Go to Profile to Log In</div>
            </div>`;
        return;
    }

    viewArea.innerHTML = `
        <div style="text-align:center; padding-top:100px; padding-bottom:100px;">
            <div style="margin-top:60px;">
                <h3 style="color:${textColor}; margin-bottom:20px;">Bar Position</h3>
                <div style="display:flex; justify-content:center; gap:40px;">
                    <div class="settings-btn ${(!inMenu && settingsRow === 0 && settingsCol[0] === 0) ? 'focused' : ''} ${appSettings.barPos === 'center' ? 'active-setting' : ''}">Top Center</div>
                    <div class="settings-btn ${(!inMenu && settingsRow === 0 && settingsCol[0] === 1) ? 'focused' : ''} ${appSettings.barPos === 'left' ? 'active-setting' : ''}">Top Left</div>
                </div>
            </div>
            <div style="margin-top:60px;">
                <h3 style="color:${textColor}; margin-bottom:20px;">Theme</h3>
                <div style="display:flex; justify-content:center; gap:40px;">
                    <div class="settings-btn ${(!inMenu && settingsRow === 1 && settingsCol[1] === 0) ? 'focused' : ''} ${appSettings.theme === 'dark' ? 'active-setting' : ''}">Dark</div>
                    <div class="settings-btn ${(!inMenu && settingsRow === 1 && settingsCol[1] === 1) ? 'focused' : ''} ${appSettings.theme === 'light' ? 'active-setting' : ''}">Light</div>
                </div>
            </div>
        </div>`;
}

async function showProfileScreen() {
    const viewArea = document.getElementById('main-view-area');
    if (!viewArea) return;
    const textColor = document.body.classList.contains('theme-light') ? '#000' : 'white';

    if (userToken) {
        try {
            const res = await twitchFetch('https://api.twitch.tv/helix/users');
            const user = res.data && res.data[0];
            const userName = user ? user.display_name : "Unknown User";
            viewArea.innerHTML = `
                <div style="text-align:center; min-width:100vw; padding-top:100px;">
                    <h1 style="color:${textColor}; font-size:48px;">Hello, ${userName}!</h1>
                    <div class="logout-btn ${!inMenu ? 'focused' : ''}">LOG OUT</div>
                </div>`;
        } catch (e) { console.error(e); }
    } else { startDeviceFlow(); }
}

async function startDeviceFlow() {
    const viewArea = document.getElementById('main-view-area');
    try {
        const resp = await fetch('https://id.twitch.tv/oauth2/device', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `client_id=${CLIENT_ID}&scopes=user:read:follows`
        });
        const data = await resp.json();
        const textColor = document.body.classList.contains('theme-light') ? '#000' : 'white';
        viewArea.innerHTML = `
            <div class="activation-container">
                <div class="activation-box">
                    <h1 style="color:#bf94ff; font-size:50px; margin-bottom: 20px;">twitch.tv/activate</h1>
                    <div style="color:${textColor}; font-size:80px; font-weight:bold; margin:20px 0; letter-spacing:15px;">${data.user_code}</div>
                </div>
            </div>`;
        pollForToken(data.device_code, data.interval);
    } catch (e) { console.error(e); }
}

function pollForToken(deviceCode, interval) {
    const pollInterval = setInterval(async () => {
        const check = await fetch('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `client_id=${CLIENT_ID}&device_code=${deviceCode}&grant_type=urn:ietf:params:oauth:grant-type:device_code`
        });
        const res = await check.json();
        if (res.access_token) {
            clearInterval(pollInterval);
            userToken = res.access_token;
            refreshToken = res.refresh_token || '';
            localStorage.setItem('twitch_access_token', userToken);
            if (res.refresh_token) localStorage.setItem('twitch_refresh_token', refreshToken);
            await fetchUserId();
            currentFocusIndex = 1; inMenu = true; updateNav(); loadContent();
        }
    }, interval * 1000);
}

function updateNav() {
    const menuItems = document.querySelectorAll('.menu-item');
    const indicator = document.getElementById('nav-indicator');
    const active = menuItems[currentFocusIndex];
    if (indicator && active) {
        indicator.style.opacity = inMenu ? "1" : "0.3";
        indicator.style.width = active.offsetWidth + 'px';
        indicator.style.left = active.offsetLeft + 'px';
    }
    menuItems.forEach((m, i) => m.classList.toggle('active-text', i === currentFocusIndex));
    const topbar = document.getElementById('topbar');
    if (topbar) {
        if (!inMenu) {
            topbar.classList.add('hidden-topbar');
            document.body.classList.add('menu-hidden');
        } else {
            topbar.classList.remove('hidden-topbar');
            document.body.classList.remove('menu-hidden');
        }
    }
}

function handleKeydown(e) {
    const menuItems = document.querySelectorAll('.menu-item');
    const selectedId = menuItems[currentFocusIndex].id;

    if (inMenu) {
        if (e.keyCode === 39 && currentFocusIndex < menuItems.length - 1) { currentFocusIndex++; updateNav(); loadContent(); }
        if (e.keyCode === 37 && currentFocusIndex > 0) { currentFocusIndex--; updateNav(); loadContent(); }
        if (e.keyCode === 40) { inMenu = false; updateNav(); if (selectedId === 'menu-home') updateHomeSelection(); if (selectedId === 'menu-follow') updateFollowSelection(); if (selectedId === 'menu-settings') showSettingsScreen(); if (selectedId === 'menu-profile') showProfileScreen(); }
    } else {
        if (selectedId === 'menu-home') {
            const currentRowData = homeDataRows[activeRow];
            if (!currentRowData) return;
            const currentLen = currentRowData.data.length;

            if (e.keyCode === 39) { // Right
                colIndices[activeRow]++;
                if (currentRowData.isHero) {
                    // Loop infinito Hero: se arriviamo oltre il secondo set, saltiamo al centro senza animazione
                    if (colIndices[activeRow] >= originalHeroCount * 2) {
                        const rowDiv = document.getElementById(`row-${activeRow}`);
                        rowDiv.style.transition = 'none';
                        colIndices[activeRow] = originalHeroCount;
                        updateHomeSelection();
                        setTimeout(() => rowDiv.style.transition = '', 50);
                    } else { updateHomeSelection(); }
                } else if (colIndices[activeRow] >= currentLen) {
                    colIndices[activeRow] = currentLen - 1;
                } else { updateHomeSelection(); }
            }
            if (e.keyCode === 37) { // Left
                colIndices[activeRow]--;
                if (currentRowData.isHero) {
                    // Loop infinito Hero: se scendiamo sotto il primo set, saltiamo al centro senza animazione
                    if (colIndices[activeRow] < originalHeroCount) {
                        const rowDiv = document.getElementById(`row-${activeRow}`);
                        rowDiv.style.transition = 'none';
                        colIndices[activeRow] = originalHeroCount * 2 - 1;
                        updateHomeSelection();
                        setTimeout(() => rowDiv.style.transition = '', 50);
                    } else { updateHomeSelection(); }
                } else if (colIndices[activeRow] < 0) {
                    colIndices[activeRow] = 0;
                } else { updateHomeSelection(); }
            }
            if (e.keyCode === 40 && activeRow < homeDataRows.length - 1) { activeRow++; updateHomeSelection(); }
            if (e.keyCode === 38) { if (activeRow > 0) { activeRow--; updateHomeSelection(); } else { inMenu = true; updateNav(); updateHomeSelection(); } }
            if (e.keyCode === 13 && currentRowData.type === 'login_btn') { currentFocusIndex = 4; inMenu = true; updateNav(); loadContent(); }
        } else if (selectedId === 'menu-follow') {
            if (followDataRows.length === 0) return;
            const currentRowData = followDataRows[followActiveRow];
            if (currentRowData.type === 'login_btn' || currentRowData.type === 'empty') {
                if (e.keyCode === 38) { inMenu = true; updateNav(); updateFollowSelection(); }
                if (e.keyCode === 13 && currentRowData.type === 'login_btn') { currentFocusIndex = 4; inMenu = true; updateNav(); loadContent(); }
                return;
            }
            if (e.keyCode === 39) {
                if (followActiveCol < currentRowData.data.length - 1) followActiveCol++;
                updateFollowSelection();
            }
            if (e.keyCode === 37) {
                if (followActiveCol > 0) followActiveCol--;
                updateFollowSelection();
            }
            if (e.keyCode === 40) {
                if (followActiveRow < followDataRows.length - 1) {
                    followActiveRow++;
                    if (followActiveCol >= followDataRows[followActiveRow].data.length) {
                        followActiveCol = followDataRows[followActiveRow].data.length - 1;
                    }
                    updateFollowSelection();
                }
            }
            if (e.keyCode === 38) {
                if (followActiveRow > 0) {
                    followActiveRow--;
                    if (followActiveCol >= followDataRows[followActiveRow].data.length) {
                        followActiveCol = followDataRows[followActiveRow].data.length - 1;
                    }
                    updateFollowSelection();
                } else {
                    inMenu = true; updateNav(); updateFollowSelection();
                }
            }
        } else if (selectedId === 'menu-settings') {
            if (!userToken) {
                if (e.keyCode === 13) { currentFocusIndex = 4; inMenu = true; updateNav(); loadContent(); }
                if (e.keyCode === 38) { inMenu = true; updateNav(); showSettingsScreen(); }
                return;
            }
            if (e.keyCode === 39 && settingsCol[settingsRow] < 1) { settingsCol[settingsRow]++; showSettingsScreen(); }
            if (e.keyCode === 37 && settingsCol[settingsRow] > 0) { settingsCol[settingsRow]--; showSettingsScreen(); }
            if (e.keyCode === 40 && settingsRow < 1) { settingsRow++; showSettingsScreen(); }
            if (e.keyCode === 38) { if (settingsRow > 0) { settingsRow--; showSettingsScreen(); } else { inMenu = true; updateNav(); showSettingsScreen(); } }
            if (e.keyCode === 13) {
                if (settingsRow === 0) appSettings.barPos = settingsCol[0] === 0 ? 'center' : 'left';
                else if (settingsRow === 1) appSettings.theme = settingsCol[1] === 0 ? 'dark' : 'light';
                saveSettings(); showSettingsScreen(); setTimeout(updateNav, 50);
            }
        } else if (selectedId === 'menu-profile') {
            if (e.keyCode === 38) { inMenu = true; updateNav(); showProfileScreen(); }
            if (e.keyCode === 13 && userToken) { localStorage.removeItem('twitch_access_token'); localStorage.removeItem('twitch_refresh_token'); localStorage.removeItem('twitch_user_id'); userToken = ''; refreshToken = ''; userId = ''; inMenu = true; updateNav(); loadContent(); }
        }
    }
}