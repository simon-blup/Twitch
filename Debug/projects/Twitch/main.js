const CLIENT_ID = '9g8h4ha9stbc9r76624evvlx4bzk39';
let userToken = localStorage.getItem('twitch_access_token') || '';
let refreshToken = localStorage.getItem('twitch_refresh_token') || '';
let userId = localStorage.getItem('twitch_user_id') || '';

// --- VARIABILI PLAYER NATIVO ---
let inPlayer = false;
let uiTimeout = null;
let playerFocusIndex = 0; // 0: Play, 1: Quality, 2: Chat
const playerBtns = ['btn-play', 'btn-quality', 'btn-chat'];
let isPlaying = true;
let isChatOpen = false;
let isQualityMenuOpen = false;
let qualityOptions = [];
let qualityFocusIndex = 0;
let currentStreamChannel = "";
let currentStreamId = "";

// Default barPos is 'center'
let appSettings = JSON.parse(localStorage.getItem('twitch_settings')) || { barPos: 'center', theme: 'dark', performanceMode: false };

let currentFocusIndex = 1; // 0: Search, 1: Home, 2: Follow, 3: Settings, 4: Profile
let inMenu = true;
let homeDataRows = [];
let activeRow = 0;
let colIndices = [];
let originalHeroCount = 0; // Per gestire il loop infinito della prima riga

// Per gestire i Settings
let settingsRow = 0;
let settingsCol = [0, 0];

// Navigation Race Condition & Animation Lock
let currentNavSequence = 0;
let isAnimating = false;
let animLockTimeout = null;

// Per gestire i Follow
let followDataRows = [];
let followActiveRow = 0;
let followActiveCol = 0;

// Search sequence to prevent race conditions
let searchSequence = 0;

// Per gestire Category View
let inCategoryView = false;
let categoryDataRows = [];
let categoryActiveRow = 0;
let categoryActiveCol = 0;
let categoryColIndices = [];
let currentCategoryData = null;
let categoryFilters = { it: true, en: true };
let categoryFilterIdx = 0;
let clipPeriod = '7d';

// Per gestire Channel View
let inChannelView = false;
let channelViewData = null;
let channelViewActiveRow = 0; // -1: Header Follow btn, 0: VODs, 1: Clip Filters, 2: Clips
let channelViewActiveCol = 0;
let channelViewColIndices = { 0: 0, 2: 0 };
let channelClipFilter = '7d'; // '7d' o '30d'
let channelClipFilterIdx = 0;
let channelIsFollowing = false;

// Per gestire Exit Menu
let inExitMenu = false;
let exitMenuFocusIdx = 0; // 0: Annulla, 1: Esci

window.onload = async function () {
    applySettings();
    if (userToken) {
        await checkLoginStatus();
        if (!userId && userToken) await fetchUserId();
    }
    
    if (!userToken) {
        currentFocusIndex = 4;
        inMenu = false;
    }
    
    updateNav();
    
    // Wait for the first home/follow load to complete
    await loadContent();

    // Hide splash screen smoothly
    const splash = document.getElementById('splash-screen');
    if (splash) {
        splash.classList.add('hidden');
    }

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let searchTimeout = null;
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            const q = this.value.trim();
            if (q.length < 2) {
                const resultsArea = document.getElementById('search-results-area');
                if (resultsArea) resultsArea.innerHTML = '';
                searchDataRows = [];
                return;
            }
            searchTimeout = setTimeout(() => executeSearch(q), 400);
        });
    }

    document.addEventListener('keydown', handleKeydown);
};

async function checkLoginStatus() {
    if (!userToken) return;
    try {
        const response = await fetch('https://id.twitch.tv/oauth2/validate', {
            headers: { 'Authorization': 'OAuth ' + userToken }
        });
        if (response.status === 401) {
            console.log("Token scaduto, tentativo di refresh...");
            await refreshTwitchToken();
        } else {
            const data = await response.json();
            userId = data.user_id;
            localStorage.setItem('twitch_user_id', userId);
        }
    } catch (error) {
        console.error("Errore durante la validazione:", error);
    }
}

async function refreshTwitchToken() {
    if (!refreshToken) {
        await logout();
        return;
    }
    try {
        const response = await fetch('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `client_id=${CLIENT_ID}&grant_type=refresh_token&refresh_token=${refreshToken}`
        });
        const data = await response.json();
        if (data.access_token) {
            userToken = data.access_token;
            refreshToken = data.refresh_token || refreshToken;
            localStorage.setItem('twitch_access_token', userToken);
            localStorage.setItem('twitch_refresh_token', refreshToken);
            console.log("Token aggiornato con successo!");
        } else {
            await logout();
        }
    } catch (error) {
        console.error("Errore durante il refresh:", error);
        await logout();
    }
}

async function logout() {
    localStorage.removeItem('twitch_access_token');
    localStorage.removeItem('twitch_refresh_token');
    localStorage.removeItem('twitch_user_id');
    userToken = '';
    refreshToken = '';
    userId = '';
    currentFocusIndex = 4;
    inMenu = false;
    updateNav();
    await loadContent();
}

function applySettings() {
    const topbarMenu = document.getElementById('main-menu');
    if (appSettings.barPos === 'center') {
        topbarMenu.style.justifyContent = 'center';
        topbarMenu.style.paddingLeft = '0px';
    } else {
        topbarMenu.style.justifyContent = 'flex-start';
        topbarMenu.style.paddingLeft = '80px';
    }

    if (appSettings.theme === 'light') {
        document.body.classList.add('theme-light');
    } else {
        document.body.classList.remove('theme-light');
    }

    if (appSettings.performanceMode) {
        document.body.classList.add('perf-mode');
    } else {
        document.body.classList.remove('perf-mode');
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
        await refreshTwitchToken();
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
    
    currentNavSequence++;
    const mySeq = currentNavSequence;

    if (viewArea) viewArea.innerHTML = `<div style="text-align:center; padding-top:100px; color:white;">Loading...</div>`;

    if (selectedId === 'menu-search') {
        searchDataRows = [];
        searchActiveRow = -1;
        searchActiveCol = 0;
        isSearchInputFocused = false;
        if (viewArea) {
            viewArea.innerHTML = `
                <div id="search-view" style="padding-bottom: 30px;">
                    <div id="search-results-area"></div>
                </div>`;
        }
        return;
    }

    if (selectedId === 'menu-home') {
        inCategoryView = false;
        activeRow = 0;
        await getTwitchHome(mySeq);
    } else if (selectedId === 'menu-follow') {
        followActiveRow = 0;
        followActiveCol = 0;
        await getFollowData(mySeq);
    } else if (selectedId === 'menu-settings') {
        settingsRow = 0;
        settingsCol = [
            appSettings.barPos === 'center' ? 0 : 1,
            appSettings.theme === 'dark' ? 0 : 1,
            appSettings.performanceMode ? 0 : 1
        ];
        if (mySeq === currentNavSequence) showSettingsScreen();
    } else if (selectedId === 'menu-profile') {
        if (mySeq === currentNavSequence) await showProfileScreen();
    }
}

async function getTwitchHome(seqId) {
    homeDataRows = [];
    try {
        // 1. Recommended (Hero)
        const recRes = await twitchFetch('https://api.twitch.tv/helix/streams?first=10');
        if (recRes.data && recRes.data.length > 0) {
            originalHeroCount = recRes.data.length;
            const loopedData = [...recRes.data, ...recRes.data, ...recRes.data];
            homeDataRows.push({ title: "", type: "stream", data: loopedData, isHero: true });
        }

        // 2. Followed Channels
        if (!appSettings.performanceMode) {
            if (userId && userToken) {
                const folRes = await twitchFetch(`https://api.twitch.tv/helix/streams/followed?user_id=${userId}&first=10`);
                if (folRes.data && folRes.data.length > 0) {
                    homeDataRows.push({ title: "Channels you follow", type: "stream", data: folRes.data });
                } else {
                    homeDataRows.push({ title: "Channels you follow", type: "stream", data: [] });
                }
            }
        }

        // 3. Top Categories
        const catRes = await twitchFetch('https://api.twitch.tv/helix/games/top?first=10');
        if (catRes.data && catRes.data.length > 0) {
            // We skip the viewer count fetch here to make home load much faster.
            // Viewer counts for categories are secondary on the home page.
            homeDataRows.push({ title: "Categories", type: "category", data: catRes.data });
        }

        if (seqId !== currentNavSequence) return; // Prevent race conditions

        colIndices = new Array(homeDataRows.length).fill(0);
        if (homeDataRows[0] && homeDataRows[0].isHero) {
            colIndices[0] = originalHeroCount;
        }
        renderHome();
    } catch (e) {
        if (seqId !== currentNavSequence) return;
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

    let html = '<div id="home-view" style="padding-bottom:60px;">';
    homeDataRows.forEach((row, rowIndex) => {
        if (row.title) {
            html += `<h3 style="color:${titleColor}; margin-left:80px; margin-bottom:30px; font-size:26px;">${row.title}</h3>`;
        }
        const gridClass = row.isHero ? 'channel-grid hero-grid' : 'channel-grid';
        const wrapperStyle = 'width:100%; overflow:visible; perspective:1200px; margin-bottom:40px;';
        html += `
            <div style="${wrapperStyle}">
                <div id="row-${rowIndex}" class="${gridClass}"></div>
            </div>
        `;
    });
    html += '</div>';
    viewArea.innerHTML = html;

    homeDataRows.forEach((row, rowIndex) => {
        const rowDiv = document.getElementById(`row-${rowIndex}`);
        if (!rowDiv) return;

        if (row.type === 'category') {
            row.data.forEach((item) => {
                const card = document.createElement('div');
                card.className = 'category-card';
                let thumb = item.box_art_url.replace('{width}', '300').replace('{height}', '400');

                let viewersHtml = '';
                if (item.viewer_count !== undefined) {
                    viewersHtml = `<div class="badge-viewers">${formatViewers(item.viewer_count)}</div>`;
                }

                card.innerHTML = `
                    ${viewersHtml}
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
    homeDataRows.forEach((row, rowIndex) => {
        const rowDiv = document.getElementById(`row-${rowIndex}`);
        if (!rowDiv) return;
        rowDiv.style.transition = 'none';
        const cards = rowDiv.querySelectorAll('.channel-card, .category-card');
        cards.forEach(c => c.style.transition = 'none');
    });

    updateHomeSelection();

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            homeDataRows.forEach((row, rowIndex) => {
                const rowDiv = document.getElementById(`row-${rowIndex}`);
                if (!rowDiv) return;
                rowDiv.style.transition = '';
                const cards = rowDiv.querySelectorAll('.channel-card, .category-card');
                cards.forEach(c => c.style.transition = '');
            });
        });
    });
}


function updateHomeSelection() {
    const centerX = window.innerWidth / 2;
    const gap = 20;

    homeDataRows.forEach((row, rowIndex) => {
        const rowDiv = document.getElementById(`row-${rowIndex}`);
        if (!rowDiv) return;

        const currentColIdx = colIndices[rowIndex];
        const isActiveRow = !inMenu && activeRow === rowIndex;

        const cards = rowDiv.querySelectorAll(row.type === 'category' ? '.category-card' : '.channel-card');
        
        cards.forEach((c, i) => {
            c.classList.remove('selected', 'hero-adjacent', 'hero-center');
            if (row.isHero) {
                if (i === currentColIdx) {
                    c.classList.add('hero-center');
                    if (isActiveRow) c.classList.add('selected');
                }
                else if (i === currentColIdx - 1 || i === currentColIdx + 1) {
                    c.classList.add('hero-adjacent');
                }
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

    if (!inMenu) {
        const rowEl = document.getElementById(`row-${activeRow}`);
        if (rowEl && rowEl.parentElement) {
            rowEl.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

async function getFollowData(seqId) {
    followDataRows = [];
    if (!userToken) {
        return;
    }
    try {
        const folRes = await twitchFetch(`https://api.twitch.tv/helix/streams/followed?user_id=${userId}&first=100`);
        let streams = folRes.data || [];

        let liveUsers = [];
        if (streams.length > 0) {
            const userIds = streams.map(s => `id=${s.user_id}`).join('&');
            try {
                const userRes = await twitchFetch(`https://api.twitch.tv/helix/users?${userIds}`);
                if (userRes && userRes.data) {
                    liveUsers = userRes.data;
                }
            } catch (e) { console.error("Error fetching live users for follow", e); }
        }
        window.followLiveUsers = liveUsers;

        for (let i = 0; i < streams.length; i += 3) {
            followDataRows.push({ type: "stream", data: streams.slice(i, i + 3) });
        }
        if (followDataRows.length === 0) {
            followDataRows.push({ type: "empty", data: [{}] });
        }
        if (liveUsers.length > 0) {
            followDataRows.push({ type: "avatars", data: liveUsers });
        }

        if (seqId !== undefined && seqId !== currentNavSequence) return;
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

    let html = '<div id="follow-view" style="padding-top:20px; padding-bottom:60px; display:flex; flex-direction:column; align-items:center; gap:20px;">';
    followDataRows.forEach((row, rowIndex) => {
        if (row.type === 'empty') {
            html += `<div style="color:white; font-size:30px; margin-top:100px;">No followed channels are live right now.</div>`;
        } else if (row.type === 'stream') {
            html += `<div id="follow-row-${rowIndex}" class="channel-grid" style="justify-content:flex-start; width: 1830px; gap: 15px;">`;
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
        } else if (row.type === 'avatars') {
            if (!appSettings.performanceMode) {
                html += `<div class="live-avatars-bar" id="follow-row-${rowIndex}">`;
                row.data.forEach((item, colIndex) => {
                    html += `<img src="${item.profile_image_url}" id="follow-card-${rowIndex}-${colIndex}" class="live-avatar-small" />`;
                });
                html += `</div>`;
            }
        }
    });

    html += '</div>';
    viewArea.innerHTML = html;
    updateFollowSelection();
}

function updateFollowSelection() {
    if (followDataRows.length === 0) return;
    const currentRowData = followDataRows[followActiveRow];

    document.querySelectorAll('#follow-view .channel-card, #follow-view .live-avatar-small').forEach(c => c.classList.remove('selected'));

    if (!inMenu && currentRowData && (currentRowData.type === 'stream' || currentRowData.type === 'avatars')) {
        const card = document.getElementById(`follow-card-${followActiveRow}-${followActiveCol}`);
        if (card) {
            card.classList.add('selected');
        }
        if (currentRowData.type === 'stream') {
            const rowEl = document.getElementById(`follow-row-${followActiveRow}`);
            if (rowEl) rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            // Per gli avatar, evitiamo 'center' che causa scatti orizzontali della pagina
            if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function showSettingsScreen() {
    const viewArea = document.getElementById('main-view-area');
    if (!viewArea) return;
    const textColor = document.body.classList.contains('theme-light') ? '#000' : 'white';

    viewArea.innerHTML = `
        <div class="full-page-screen">
            <div style="display:flex; flex-direction:column; gap:60px; width:100%;">
                <div>
                    <h3 style="color:${textColor}; margin-bottom:20px; text-align:center;">Bar Position</h3>
                    <div style="display:flex; justify-content:center; gap:40px;">
                        <div class="settings-btn ${(!inMenu && settingsRow === 0 && settingsCol[0] === 0) ? 'focused' : ''} ${appSettings.barPos === 'center' ? 'active-setting' : ''}">Top Center</div>
                        <div class="settings-btn ${(!inMenu && settingsRow === 0 && settingsCol[0] === 1) ? 'focused' : ''} ${appSettings.barPos === 'left' ? 'active-setting' : ''}">Top Left</div>
                    </div>
                </div>
                <div>
                    <h3 style="color:${textColor}; margin-bottom:20px; text-align:center;">Theme</h3>
                    <div style="display:flex; justify-content:center; gap:40px;">
                        <div class="settings-btn ${(!inMenu && settingsRow === 1 && settingsCol[1] === 0) ? 'focused' : ''} ${appSettings.theme === 'dark' ? 'active-setting' : ''}">Dark</div>
                        <div class="settings-btn ${(!inMenu && settingsRow === 1 && settingsCol[1] === 1) ? 'focused' : ''} ${appSettings.theme === 'light' ? 'active-setting' : ''}">Light</div>
                    </div>
                </div>
                <div>
                    <h3 style="color:${textColor}; margin-bottom:20px; text-align:center;">Performance Mode</h3>
                    <div style="display:flex; justify-content:center; gap:40px;">
                        <div class="settings-btn ${(!inMenu && settingsRow === 2 && settingsCol[2] === 0) ? 'focused' : ''} ${appSettings.performanceMode ? 'active-setting' : ''}">On</div>
                        <div class="settings-btn ${(!inMenu && settingsRow === 2 && settingsCol[2] === 1) ? 'focused' : ''} ${!appSettings.performanceMode ? 'active-setting' : ''}">Off</div>
                    </div>
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

            // Debug info
            const tokenStatus = refreshToken ? "Refresh Token: Present" : "Refresh Token: Missing!";
            const idStatus = userId ? "User ID: " + userId : "User ID: Missing!";

            viewArea.innerHTML = `
                <div class="full-page-screen">
                    <h1 style="color:${textColor}; font-size:48px; margin-bottom: 20px;">Hello, ${userName}!</h1>
                    <div style="color:#adadb8; font-size:16px; margin-bottom:40px;">${tokenStatus} | ${idStatus}</div>
                    <div class="logout-btn ${!inMenu ? 'focused' : ''}" style="margin-top: 0;">LOG OUT</div>
                </div>`;
        } catch (e) { console.error(e); }
    } else { 
        await startDeviceFlow(); 
    }
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
                    <h1 style="color:#bf94ff; font-size:38px; margin-bottom: 15px;">twitch.tv/activate</h1>
                    <div style="color:${textColor}; font-size:60px; font-weight:bold; margin:15px 0; letter-spacing:10px;">${data.user_code}</div>
                </div>
            </div>`;
        pollForToken(data.device_code, data.interval);
        return true;
    } catch (e) { 
        console.error(e); 
        return false;
    }
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
            localStorage.setItem('twitch_refresh_token', refreshToken);
            
            // Re-show splash during this critical loading phase
            const splash = document.getElementById('splash-screen');
            if (splash) {
                splash.classList.remove('hidden');
                // Optional: Update splash to indicate we are loading content
            }

            await fetchUserId();
            
            // Pre-fetch Follow data
            await getFollowData();

            currentFocusIndex = 1; 
            inMenu = true; 
            updateNav(); 
            
            // Wait for Home content to be fully ready
            await loadContent(); 
            
            if (splash) splash.classList.add('hidden');
        }
    }, interval * 1000);
}

function updateNav() {
    const menuItems = document.querySelectorAll('.menu-item');
    const indicator = document.getElementById('nav-indicator');
    const active = menuItems[currentFocusIndex];
    const searchDropdown = document.getElementById('search-dropdown');
    const searchInput = document.getElementById('search-input');

    if (indicator && active) {
        indicator.style.opacity = inMenu ? "1" : "0.3";
        indicator.style.width = active.offsetWidth + 'px';
        indicator.style.left = active.offsetLeft + 'px';
    }
    menuItems.forEach((m, i) => m.classList.toggle('active-text', i === currentFocusIndex));

    if (searchDropdown && searchInput) {
        const isOnLens = active && active.id === 'menu-search' && inMenu;
        if (isSearchInputFocused || isOnLens) {
            searchDropdown.classList.add('search-open');
            searchInput.disabled = false;
            if (isSearchInputFocused) {
                searchInput.classList.add('search-focused');
                setTimeout(() => { searchInput.focus(); }, 100);
            } else {
                searchInput.classList.remove('search-focused');
                searchInput.blur();
            }
        } else {
            searchDropdown.classList.remove('search-open');
            searchInput.classList.remove('search-focused');
            searchInput.blur();
            searchInput.disabled = true;
        }
    }

    const topbar = document.getElementById('topbar');
    if (topbar) {
        if (!inMenu && !isSearchInputFocused) {
            topbar.classList.add('hidden-topbar');
            document.body.classList.add('menu-hidden');
        } else {
            topbar.classList.remove('hidden-topbar');
            document.body.classList.remove('menu-hidden');
        }
    }
}

// --- SEARCH ---
let searchDataRows = [];
let searchActiveRow = 0;
let searchActiveCol = 0;
let isSearchInputFocused = false;

async function executeSearch(query) {
    const resultsArea = document.getElementById('search-results-area');
    if (!resultsArea) return;

    try {
        searchSequence++;
        const mySearchSeq = searchSequence;

        const [chRes, catRes] = await Promise.all([
            twitchFetch(`https://api.twitch.tv/helix/search/channels?query=${encodeURIComponent(query)}&first=20`),
            twitchFetch(`https://api.twitch.tv/helix/search/categories?query=${encodeURIComponent(query)}&first=10`)
        ]);

        if (mySearchSeq !== searchSequence) return;

        const channels = chRes.data || [];
        const categories = catRes.data || [];

        const liveChannels = channels.filter(c => c.is_live);
        const allChannels = channels;

        let liveStreams = [];
        if (liveChannels.length > 0) {
            const userIds = liveChannels.map(c => `user_id=${c.id}`).join('&');
            try {
                const streamRes = await twitchFetch(`https://api.twitch.tv/helix/streams?${userIds}`);
                if (mySearchSeq !== searchSequence) return;
                liveStreams = streamRes.data || [];
            } catch (e) { console.error("Error fetching live streams", e); }
        }

        let popularCategories = [];
        if (categories.length > 0) {
            const catPromises = categories.map(async (cat) => {
                try {
                    const stRes = await twitchFetch(`https://api.twitch.tv/helix/streams?game_id=${cat.id}&first=100`);
                    let viewers = 0;
                    if (stRes && stRes.data) {
                        viewers = stRes.data.reduce((sum, stream) => sum + stream.viewer_count, 0);
                    }
                    cat.viewer_count = viewers;
                } catch (e) { cat.viewer_count = 0; }
                return cat;
            });
            await Promise.all(catPromises);
            if (mySearchSeq !== searchSequence) return;
            popularCategories = categories.filter(c => c.viewer_count >= 100);
        }

        if (allChannels.length > 0) {
            const followerPromises = allChannels.map(async (c) => {
                try {
                    const folRes = await twitchFetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${c.id}`);
                    c.follower_count = folRes.total || 0;
                } catch (e) {
                    c.follower_count = 0;
                }
                return c;
            });
            await Promise.all(followerPromises);
            if (mySearchSeq !== searchSequence) return;
            allChannels.sort((a, b) => b.follower_count - a.follower_count);
        }

        searchDataRows = [];
        const limit = appSettings.performanceMode ? 3 : 6;

        if (liveStreams.length > 0) {
            searchDataRows.push({ title: 'Canali Live', type: 'live', data: liveStreams.slice(0, limit) });
        }
        if (popularCategories.length > 0) {
            searchDataRows.push({ title: 'Categorie', type: 'category', data: popularCategories.slice(0, limit) });
        }
        if (allChannels.length > 0) {
            searchDataRows.push({ title: 'Canali', type: 'channel', data: allChannels.slice(0, limit) });
        }

        if (searchDataRows.length === 0) {
            resultsArea.innerHTML = `<div style="text-align:center; padding-top:60px; color:#adadb8; font-size:24px;">Nessun risultato per "${query}"</div>`;
            return;
        }

        // Only reset selection if we are still focusing the search bar.
        // If the user already moved down, don't break their navigation.
        if (isSearchInputFocused || inMenu) {
            searchActiveRow = -1;
            searchActiveCol = 0;
        }
        renderSearchResults();
    } catch (e) {
        console.error(e);
        resultsArea.innerHTML = `<div style="color:red; text-align:center; padding-top:60px;">Errore nella ricerca.</div>`;
    }
}

function renderSearchResults() {
    const resultsArea = document.getElementById('search-results-area');
    if (!resultsArea) return;
    const isLight = document.body.classList.contains('theme-light');
    const titleColor = isLight ? '#000' : 'white';

    // We use a flex container with min-height so that if there are multiple rows, 
    // the last one can be pushed to the bottom of the viewport.
    // Reduced padding-bottom to 40px (half of previous 80px).
    let html = `<div style="display:flex; flex-direction:column; min-height:calc(100vh - 310px); padding-bottom:40px;">`;
    searchDataRows.forEach((row, rIdx) => {
        const isLast = rIdx === searchDataRows.length - 1;
        const rowStyle = (isLast && searchDataRows.length > 1) ? 'margin-top:auto;' : '';
        
        html += `<div style="${rowStyle}">`;
        html += `<h3 style="color:${titleColor}; margin: 30px 0 20px 80px; font-size:26px;">${row.title}</h3>`;
        html += `<div style="overflow:hidden; width:100%; position:relative;">`;
        html += `<div id="search-row-${rIdx}" style="display:flex; gap:30px; transition: transform 0.3s ease; padding: 10px 80px;">`;
        row.data.forEach((item, cIdx) => {
            const isSelected = searchActiveRow === rIdx && searchActiveCol === cIdx;
            const selClass = isSelected ? 'selected' : '';
            if (row.type === 'live') {
                let thumb = item.thumbnail_url.replace('{width}', '600').replace('{height}', '338');
                const viewers = formatViewers(item.viewer_count);
                html += `
                    <div id="search-card-${rIdx}-${cIdx}" class="channel-card follow-card ${selClass}" style="flex-shrink:0;">
                        <div class="badge-live">LIVE</div>
                        <div class="badge-viewers">${viewers}</div>
                        <img src="${thumb}" style="width:100%; height:100%; object-fit:cover;">
                        <div class="card-info">
                            <div style="font-size:22px; font-weight:bold; color:white;">${item.user_name}</div>
                            <div style="font-size:16px; color:#adadb8; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.title}</div>
                        </div>
                    </div>`;
            } else if (row.type === 'category') {
                const box = item.box_art_url || '';
                // Search API often returns hardcoded URLs like -52x72.jpg instead of {width} templates
                const highResBox = box.replace(/-[0-9]+x[0-9]+\./, '-400x532.').replace('{width}', '400').replace('{height}', '532');
                html += `
                    <div class="category-card ${selClass}" id="search-card-${rIdx}-${cIdx}" style="flex-shrink:0; width:200px; height:266px;">
                        <img src="${highResBox}" style="width:100%; height:100%; border-radius:10px; object-fit:cover;">
                        <div style="margin-top:10px; font-weight:bold; color:${titleColor}; text-align:center;">${item.name}</div>
                    </div>`;
            } else if (row.type === 'channel') {
                const thumb = item.thumbnail_url || '';
                const highResThumb = thumb.replace(/-[0-9]+x[0-9]+\./, '-300x300.').replace('{width}', '300').replace('{height}', '300');
                html += `
                    <div class="search-channel-card ${selClass}" id="search-card-${rIdx}-${cIdx}" style="flex-shrink:0; width:350px;">
                        <img src="${highResThumb}" class="search-avatar">
                        <div class="search-info">
                            <div class="search-name">${item.display_name}</div>
                            <div class="search-game">${item.game_name || 'Offline'}</div>
                        </div>
                    </div>`;
            }
        });
        html += `</div></div></div>`;
    });
    html += `</div>`;
    resultsArea.innerHTML = html;
}

function updateSearchSelection() {
    document.querySelectorAll('#search-results-area .selected').forEach(el => el.classList.remove('selected'));

    if (searchActiveRow >= 0 && searchActiveCol >= 0) {
        const activeCard = document.getElementById(`search-card-${searchActiveRow}-${searchActiveCol}`);
        if (activeCard) {
            activeCard.classList.add('selected');

            const rowDiv = document.getElementById(`search-row-${searchActiveRow}`);
            if (rowDiv) {
                let cardWidth = activeCard.offsetWidth + 30; // 30 is gap
                let offset = - (searchActiveCol * cardWidth);
                rowDiv.style.transform = `translateX(${offset}px)`;
            }
            activeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

// --- CHANNEL PROFILE VIEW ---
async function openChannelView(loginName, isRefetch = false) {
    inChannelView = true;
    inMenu = false;

    const viewArea = document.getElementById('main-view-area');
    if (!viewArea) return;

    if (!isRefetch) {
        viewArea.innerHTML = `<div style="text-align:center; padding-top:100px; color:white;">Loading ${loginName}...</div>`;
        channelViewActiveRow = 0;
        channelViewActiveCol = 0;
        channelViewColIndices = { 0: 0, 2: 0 };
        channelClipFilter = '7d';
        channelClipFilterIdx = 0;
    }

    try {
        // 1. User Info
        const userRes = await twitchFetch(`https://api.twitch.tv/helix/users?login=${loginName}`);
        const user = userRes.data[0];
        if (!user) throw new Error("User not found");

        // 2. Follower count & status
        const folRes = await twitchFetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${user.id}`);
        user.follower_count = folRes.total || 0;

        if (userId && userToken) {
            const isFolRes = await twitchFetch(`https://api.twitch.tv/helix/channels/followed?user_id=${userId}&broadcaster_id=${user.id}`);
            channelIsFollowing = isFolRes.data && isFolRes.data.length > 0;
        }

        // 3. Live Stream
        const streamRes = await twitchFetch(`https://api.twitch.tv/helix/streams?user_id=${user.id}`);
        const isLive = streamRes.data && streamRes.data.length > 0;
        const liveStream = isLive ? streamRes.data[0] : null;

        // 4. VODs
        const vodRes = await twitchFetch(`https://api.twitch.tv/helix/videos?user_id=${user.id}&type=archive&first=20`);
        let vods = vodRes.data || [];

        let combinedVods = [];
        if (isLive) {
            combinedVods.push({ isLiveItem: true, ...liveStream });
        }
        combinedVods = combinedVods.concat(vods);

        // 5. Clips
        let startedAt = "";
        let now = new Date();
        if (channelClipFilter === '7d') {
            startedAt = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        } else if (channelClipFilter === '30d') {
            startedAt = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        }
        const clipRes = await twitchFetch(`https://api.twitch.tv/helix/clips?broadcaster_id=${user.id}&first=20&started_at=${startedAt}`);
        let clips = clipRes.data || [];

        channelViewData = {
            user,
            isLive,
            vods: combinedVods,
            clips
        };

        if (!isRefetch) {
            if (combinedVods.length > 0) {
                channelViewActiveRow = 0;
            } else if (clips.length > 0 || channelClipFilter === '30d') {
                channelViewActiveRow = 1;
            } else {
                channelViewActiveRow = -2; // Indicates no focusable elements
            }
        }

        renderChannelView();
    } catch (e) {
        console.error(e);
        viewArea.innerHTML = `<div style="color:red; text-align:center; padding-top:100px;">Error loading channel.</div>`;
    }
}

function renderChannelView() {
    const viewArea = document.getElementById('main-view-area');
    if (!viewArea) return;
    const isLight = document.body.classList.contains('theme-light');
    const titleColor = isLight ? '#000' : 'white';

    const user = channelViewData.user;
    const isLive = channelViewData.isLive;

    let html = `<div id="channel-view" style="padding-bottom:60px; position:relative;">`;

    // Header
    html += `
        <div class="channel-header">
            <div class="channel-avatar-container">
                <img src="${user.profile_image_url}" class="channel-avatar-large ${isLive ? 'is-live' : ''}" />
                ${isLive ? '<div class="live-badge-avatar">LIVE</div>' : ''}
            </div>
            <div class="channel-info-wrapper">
                <h1 class="channel-name-large">${user.display_name}</h1>
                <div class="channel-stats">${formatViewers(user.follower_count)} followers</div>
                ${user.description ? `<div style="color:${isLight ? '#666' : '#adadb8'}; margin-top:10px; font-size:16px; max-width:800px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${user.description}</div>` : ''}
            </div>
        </div>
    `;

    // Row 0: Videos
    if (channelViewData.vods.length > 0) {
        html += `<h3 style="color:${titleColor}; margin-left:80px; margin-bottom:20px; margin-top:30px; font-size:26px;">Videos</h3>`;
        html += `<div style="width:100%; overflow:visible; perspective:1200px; margin-bottom:40px;">
                    <div id="channel-row-0" class="channel-grid">`;
        channelViewData.vods.forEach((item, idx) => {
            let thumb = item.thumbnail_url ? item.thumbnail_url.replace('%{width}', '600').replace('%{height}', '338').replace('{width}', '600').replace('{height}', '338') : '';
            html += `
                <div class="channel-card" id="channel-card-0-${idx}">
                    ${item.isLiveItem ? '<div class="badge-live">LIVE</div>' : '<div class="badge-viewers no-dot">' + item.duration + '</div>'}
                    ${item.isLiveItem ? '<div class="badge-viewers">' + formatViewers(item.viewer_count) + '</div>' : ''}
                    <img src="${thumb}" style="width:100%; height:100%; object-fit:cover;">
                    <div class="card-info">
                        <div style="font-size:22px; font-weight:bold; color:white;">${item.title}</div>
                        <div style="font-size:16px; color:#adadb8; margin-top:6px;">${item.isLiveItem ? item.game_name : new Date(item.created_at).toLocaleDateString()}</div>
                    </div>
                </div>`;
        });
        html += `   </div>
                 </div>`;
    }

    // Row 1: Filters & Row 2: Clips
    if (channelViewData.clips.length > 0 || channelClipFilter === '30d') {
        html += `<div style="display:flex; align-items:center; gap:30px; margin-left:80px; margin-top:20px; margin-bottom:20px;">
                    <h3 style="color:${titleColor}; font-size:26px; margin:0;">Top Clips</h3>
                    <div style="display:flex; gap:10px;">
                        <div class="filter-btn ${channelClipFilter === '7d' ? 'active' : ''}" id="channel-filter-0">7 Giorni</div>
                        <div class="filter-btn ${channelClipFilter === '30d' ? 'active' : ''}" id="channel-filter-1">30 Giorni</div>
                    </div>
                 </div>`;

        if (channelViewData.clips.length > 0) {
            html += `<div style="width:100%; overflow:visible; perspective:1200px; margin-bottom:40px;">
                        <div id="channel-row-2" class="channel-grid">`;
            channelViewData.clips.forEach((item, idx) => {
                let thumb = item.thumbnail_url;
                html += `
                    <div class="channel-card" id="channel-card-2-${idx}">
                        <div class="badge-viewers no-dot">${formatViewers(item.view_count)} views</div>
                        <img src="${thumb}" style="width:100%; height:100%; object-fit:cover;">
                        <div class="card-info">
                            <div style="font-size:22px; font-weight:bold; color:white;">${item.title}</div>
                            <div style="font-size:16px; color:#adadb8; margin-top:6px;">By ${item.broadcaster_name}</div>
                        </div>
                    </div>`;
            });
            html += `   </div>
                     </div>`;
        } else {
            html += `<div style="color:#adadb8; margin-left:80px; font-size:20px; margin-bottom:40px;">No clips available for this period.</div>`;
        }
    }

    if (channelViewData.vods.length === 0 && channelViewData.clips.length === 0 && channelClipFilter !== '30d') {
        html += `<div style="text-align:center; color:#adadb8; font-size:24px; padding-top:100px; font-weight:300; letter-spacing:1px;">No data available for this channel</div>`;
    }

    html += `</div>`;
    viewArea.innerHTML = html;
    updateChannelSelection();

    viewArea.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateChannelSelection() {
    // Reset all
    document.querySelectorAll('#channel-view .selected, #channel-view .focused').forEach(el => {
        el.classList.remove('selected', 'focused');
    });

    const row0 = document.getElementById('channel-row-0');
    if (row0) {
        let cardWidth = 600 + 20;
        let offset = 80 - ((channelViewColIndices[0] || 0) * cardWidth);
        row0.style.transform = `translateX(${offset}px)`;
    }

    const row2 = document.getElementById('channel-row-2');
    if (row2) {
        let cardWidth = 600 + 20;
        let offset = 80 - ((channelViewColIndices[2] || 0) * cardWidth);
        row2.style.transform = `translateX(${offset}px)`;
    }

    if (channelViewActiveRow === 0) {
        const card = document.getElementById(`channel-card-0-${channelViewColIndices[0] || 0}`);
        if (card) {
            card.classList.add('selected');
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else if (channelViewActiveRow === 1) {
        // Filters
        const filterBtn = document.getElementById(`channel-filter-${channelClipFilterIdx}`);
        if (filterBtn) {
            filterBtn.classList.add('focused');
            filterBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else if (channelViewActiveRow === 2) {
        const card = document.getElementById(`channel-card-2-${channelViewColIndices[2] || 0}`);
        if (card) {
            card.classList.add('selected');
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

// --- CATEGORY VIEW ---
async function openCategoryView(category, isRefetch = false) {
    inCategoryView = true;
    inMenu = false;
    currentCategoryData = category;

    const viewArea = document.getElementById('main-view-area');
    if (!viewArea) return;

    if (!isRefetch) {
        viewArea.innerHTML = `<div style="text-align:center; padding-top:100px; color:white;">Loading ${category.name}...</div>`;
    }

    try {
        let langQuery = "";
        if (categoryFilters.it) langQuery += "&language=it";
        if (categoryFilters.en) langQuery += "&language=en";

        // Clip period
        let startedAt = "";
        let now = new Date();
        if (clipPeriod === '7d') {
            startedAt = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        } else if (clipPeriod === '30d') {
            startedAt = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        }

        const streamRes = await twitchFetch(`https://api.twitch.tv/helix/streams?game_id=${category.id}&first=20${langQuery}`);
        const streams = streamRes.data || [];

        const clipRes = await twitchFetch(`https://api.twitch.tv/helix/clips?game_id=${category.id}&first=20${startedAt ? '&started_at=' + startedAt : ''}`);
        const clips = clipRes.data || [];

        categoryDataRows = [];
        if (streams.length > 0) categoryDataRows.push({ title: 'Live Streams', type: 'stream', data: streams });
        if (clips.length > 0) categoryDataRows.push({ title: 'Top Clips', type: 'clip', data: clips });

        if (!isRefetch) {
            categoryActiveRow = 0;
            categoryActiveCol = 0;
            categoryColIndices = new Array(categoryDataRows.length).fill(0);
            categoryFilterIdx = 0;
        }

        renderCategoryView();
    } catch (e) {
        console.error(e);
        viewArea.innerHTML = `<div style="color:red; text-align:center; padding-top:100px;">Error loading category.</div>`;
    }
}

function renderCategoryView() {
    const viewArea = document.getElementById('main-view-area');
    if (!viewArea) return;
    const isLight = document.body.classList.contains('theme-light');
    const titleColor = isLight ? '#000' : 'white';

    const rawBox = currentCategoryData.box_art_url || '';
    let boxThumb = rawBox.replace(/-[0-9]+x[0-9]+\./, '-285x380.').replace('{width}', '285').replace('{height}', '380');
    let viewers = formatViewers(currentCategoryData.viewer_count || 0);

    let html = `
        <div id="category-view" style="padding-bottom:60px; position:relative;">
            
            <div style="display:flex; align-items:flex-end; gap:35px; margin-left:80px; margin-right:80px; margin-bottom:30px; padding-top:40px;">
                <img src="${boxThumb}" style="width:150px; height:200px; border-radius:10px; box-shadow:0 10px 30px rgba(0,0,0,0.8); object-fit:contain; background-color:#1a1a20;">
                <div style="padding-bottom:5px; ${isLight ? '' : 'text-shadow: 0 4px 10px rgba(0,0,0,0.8);'} flex: 1;">
                    <h1 style="color:${titleColor}; font-size:48px; margin:0 0 8px 0; font-weight:bold;">${currentCategoryData.name}</h1>
                    <div style="color:#bf94ff; font-size:22px; font-weight:600;">${viewers} viewers</div>
                </div>
                <div style="display:flex; gap:30px; padding-bottom:10px; align-items:center;">
                    <div style="display:flex; flex-direction:column; gap:5px;">
                        <span style="color:${isLight ? '#555' : '#adadb8'}; font-size:12px; font-weight:bold; text-transform:uppercase;">Streams</span>
                        <div style="display:flex; gap:10px;">
                            <div class="filter-btn ${categoryFilters.it ? 'active' : ''} ${categoryActiveRow === -1 && categoryFilterIdx === 0 ? 'focused' : ''}">ITA</div>
                            <div class="filter-btn ${categoryFilters.en ? 'active' : ''} ${categoryActiveRow === -1 && categoryFilterIdx === 1 ? 'focused' : ''}">ENG</div>
                        </div>
                    </div>
                    <div style="width:1px; height:40px; background:${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)'};"></div>
                    <div style="display:flex; flex-direction:column; gap:5px;">
                        <span style="color:${isLight ? '#555' : '#adadb8'}; font-size:12px; font-weight:bold; text-transform:uppercase;">Clips</span>
                        <div style="display:flex; gap:10px;">
                            <div class="filter-btn ${clipPeriod === '7d' ? 'active' : ''} ${categoryActiveRow === -1 && categoryFilterIdx === 2 ? 'focused' : ''}">7 Giorni</div>
                            <div class="filter-btn ${clipPeriod === '30d' ? 'active' : ''} ${categoryActiveRow === -1 && categoryFilterIdx === 3 ? 'focused' : ''}">30 Giorni</div>
                        </div>
                    </div>
                </div>
            </div>
    `;

    categoryDataRows.forEach((row, rowIndex) => {
        html += `<h3 style="color:${titleColor}; margin-left:80px; margin-bottom:30px; margin-top:20px; font-size:26px;">${row.title}</h3>`;
        html += `<div style="width:100%; overflow:visible; perspective:1200px; margin-bottom:40px;">
                    <div id="cat-row-${rowIndex}" class="channel-grid"></div>
                 </div>`;
    });

    html += `</div>`;
    viewArea.innerHTML = html;

    categoryDataRows.forEach((row, rowIndex) => {
        const rowDiv = document.getElementById(`cat-row-${rowIndex}`);
        if (!rowDiv) return;

        row.data.forEach((item, colIndex) => {
            const card = document.createElement('div');
            card.className = 'channel-card';
            card.id = `cat-card-${rowIndex}-${colIndex}`;

            if (row.type === 'stream') {
                let thumb = item.thumbnail_url.replace('{width}', '800').replace('{height}', '450');
                card.innerHTML = `
                    <div class="badge-live">LIVE</div>
                    <div class="badge-viewers">${formatViewers(item.viewer_count)}</div>
                    <img src="${thumb}" style="width:100%; height:100%; object-fit:cover;">
                    <div class="card-info">
                        <div style="font-size:22px; font-weight:bold; color:white;">${item.user_name}</div>
                        <div style="font-size:16px; color:#adadb8; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.title}</div>
                    </div>`;
            } else if (row.type === 'clip') {
                let thumb = item.thumbnail_url;
                card.innerHTML = `
                    <div class="badge-viewers no-dot">${formatViewers(item.view_count)} views</div>
                    <img src="${thumb}" style="width:100%; height:100%; object-fit:cover;">
                    <div class="card-info">
                        <div style="font-size:22px; font-weight:bold; color:white;">${item.title}</div>
                        <div style="font-size:16px; color:#adadb8; margin-top:6px;">By ${item.broadcaster_name}</div>
                    </div>`;
            }
            rowDiv.appendChild(card);
        });
    });

    updateCategorySelection();

    // Scroll to top on initial render
    viewArea.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateCategorySelection() {
    categoryDataRows.forEach((row, rowIndex) => {
        const rowDiv = document.getElementById(`cat-row-${rowIndex}`);
        if (!rowDiv) return;

        let targetColIdx = categoryColIndices[rowIndex] || 0;
        let cardWidth = 600 + 20; // Match .channel-card width (600) + gap (20)
        let offset = 80 - (targetColIdx * cardWidth);

        rowDiv.style.transform = `translateX(${offset}px)`;

        Array.from(rowDiv.children).forEach((c, idx) => {
            if (rowIndex === categoryActiveRow && idx === categoryActiveCol) {
                c.classList.add('selected');
            } else {
                c.classList.remove('selected');
            }
        });
    });

    // Smooth scroll to active row
    if (categoryActiveRow >= 0) {
        const rowEl = document.getElementById(`cat-row-${categoryActiveRow}`);
        if (rowEl) {
            rowEl.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

function handleKeydown(e) {
    if (inExitMenu) {
        if (e.keyCode === 39 && exitMenuFocusIdx < 1) {
            exitMenuFocusIdx++;
            updateExitMenuFocus();
        } else if (e.keyCode === 37 && exitMenuFocusIdx > 0) {
            exitMenuFocusIdx--;
            updateExitMenuFocus();
        } else if (e.keyCode === 13) {
            if (exitMenuFocusIdx === 1) {
                try {
                    tizen.application.getCurrentApplication().exit();
                } catch (err) {
                    console.error('Cannot exit app', err);
                    window.close();
                }
            } else {
                hideExitMenu();
            }
        } else if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
            hideExitMenu();
        }
        return;
    }

    // MANDATORY LOGIN LOCK: Block all navigation if no token
    if (!userToken) {
        if (e.keyCode >= 37 && e.keyCode <= 40) {
            e.preventDefault();
            return;
        }
        if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
            showExitMenu();
            return;
        }
        return;
    }

    const isVertical = e.keyCode === 38 || e.keyCode === 40;

    // --- GESTIONE TELECOMANDO PER IL PLAYER ---
    if (inPlayer) {
        const ui = document.getElementById('player-ui');
        const isUIHidden = ui.classList.contains('hidden');

        // Tasto Back / Return (Chiudi menu o chiudi player)
        if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
            if (isQualityMenuOpen) {
                isQualityMenuOpen = false; document.getElementById('quality-menu').style.display = 'none';
                showPlayerUI(); updatePlayerFocus();
            } else {
                closeNativePlayer();
            }
            return;
        }

        // Se la UI è nascosta, qualsiasi freccia o OK la fa riapparire
        if (isUIHidden) {
            if (e.keyCode === 13 || (e.keyCode >= 37 && e.keyCode <= 40)) { showPlayerUI(); updatePlayerFocus(); }
            return;
        }

        showPlayerUI(); // Resetta il timer di auto-hide

        // Navigazione Menu Qualità
        if (isQualityMenuOpen) {
            if (e.keyCode === 38 && qualityFocusIndex > 0) qualityFocusIndex--;
            if (e.keyCode === 40 && qualityFocusIndex < qualityOptions.length - 1) qualityFocusIndex++;
            if (e.keyCode === 13) {
                playVideoUrl(qualityOptions[qualityFocusIndex].url);
                isQualityMenuOpen = false; document.getElementById('quality-menu').style.display = 'none';
            }
            updatePlayerFocus(); return;
        }

        // Navigazione Bottoni Player
        if (e.keyCode === 39 && playerFocusIndex < playerBtns.length - 1) playerFocusIndex++;
        if (e.keyCode === 37 && playerFocusIndex > 0) playerFocusIndex--;
        if (e.keyCode === 13) { // Tasto OK
            if (playerFocusIndex === 0) { // Play/Pause
                try {
                    if (isPlaying) {
                        webapis.avplay.pause();
                        isPlaying = false;
                        document.getElementById('icon-pause').style.display = 'none';
                        document.getElementById('icon-play').style.display = 'block';
                    } else {
                        webapis.avplay.play();
                        isPlaying = true;
                        document.getElementById('icon-pause').style.display = 'block';
                        document.getElementById('icon-play').style.display = 'none';
                    }
                } catch (e) { console.error('AVPlay play/pause error', e); }
            } else if (playerFocusIndex === 1) { // Follow (API nuova V2)
                if (userToken && currentStreamId) {
                    twitchFetch(`https://api.twitch.tv/helix/channels/followers`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ broadcaster_id: currentStreamId, user_id: userId })
                    });
                }
            } else if (playerFocusIndex === 2) { // Menu Qualità
                const menu = document.getElementById('quality-menu');
                menu.innerHTML = qualityOptions.map((q, i) => `<div class="quality-item ${i === 0 ? 'focused' : ''}">${q.name}</div>`).join('');
                menu.style.display = 'flex'; isQualityMenuOpen = true; qualityFocusIndex = 0;
            } else if (playerFocusIndex === 3) { // Toggle Chat
                isChatOpen = !isChatOpen;
                document.getElementById('twitch-chat').style.display = isChatOpen ? 'block' : 'none';
            }
        }
        updatePlayerFocus();
        return;
    }

    const searchInput = document.getElementById('search-input');
    if (searchInput && document.activeElement === searchInput) {
        if (!isSearchInputFocused) {
            isSearchInputFocused = true;
            inMenu = false;
        }
    }

    const menuItems = document.querySelectorAll('.menu-item');
    const selectedId = menuItems[currentFocusIndex].id;

    if (inMenu) {
        if (!userToken) {
            // Mandatory Login Lock: stay on Profile
            if (currentFocusIndex !== 4) {
                currentFocusIndex = 4;
                updateNav();
            }
            if (e.keyCode === 40) { inMenu = false; updateNav(); showProfileScreen(); }
            return;
        }

        if (selectedId === 'menu-search') {
            if (e.keyCode === 13 || e.keyCode === 40) {
                // Enter or Down: go from menu to search bar
                e.preventDefault();
                inMenu = false;
                isSearchInputFocused = true;
                updateNav();
                return;
            }
        }
        if (e.keyCode === 39 && currentFocusIndex < menuItems.length - 1) { currentFocusIndex++; updateNav(); loadContent(); }
        if (e.keyCode === 37 && currentFocusIndex > 0) { currentFocusIndex--; updateNav(); loadContent(); }
        if (e.keyCode === 40 && selectedId !== 'menu-search') { inMenu = false; updateNav(); if (selectedId === 'menu-home') updateHomeSelection(); if (selectedId === 'menu-follow') updateFollowSelection(); if (selectedId === 'menu-settings') showSettingsScreen(); if (selectedId === 'menu-profile') showProfileScreen(); }
    } else if (isSearchInputFocused) {
        if (e.keyCode === 13) {
            // "Done" on virtual keyboard
            e.preventDefault();
            document.getElementById('search-input').blur();
            document.body.focus(); // Prevent native spatial navigation black-holes
            if (searchDataRows.length > 0) {
                isSearchInputFocused = false;
                searchActiveRow = 0;
                searchActiveCol = 0;
                updateNav();
                updateSearchSelection();
            }
            return;
        }
        if (e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
            // Tizen Return or Escape
            e.preventDefault();
            const input = document.getElementById('search-input');
            if (document.activeElement === input) {
                input.blur();
                document.body.focus();
            } else {
                // Already blurred: return to menu
                isSearchInputFocused = false;
                inMenu = true;
                updateNav();
            }
            return;
        }
        if (e.keyCode === 38) {
            // Up arrow: back to menu
            e.preventDefault();
            isSearchInputFocused = false;
            inMenu = true;
            updateNav();
            return;
        }
        if (e.keyCode === 40 && searchDataRows.length > 0) {
            // Down arrow: go to search results
            e.preventDefault();
            isSearchInputFocused = false;
            searchActiveRow = 0;
            searchActiveCol = 0;
            updateNav();
            updateSearchSelection();
            return;
        }
        if (e.keyCode === 37 || e.keyCode === 39) {
            e.stopPropagation(); // Prevent TV spatial navigation from stealing focus
            return;
        }
        // Typing keys pass through naturally
        return;
    } else {
        if (inChannelView) {
            // BACK BUTTON
            if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
                inChannelView = false;
                const menuItems = document.querySelectorAll('.menu-item');
                const selectedId = menuItems[currentFocusIndex].id;
                if (selectedId === 'menu-search') {
                    inMenu = false;
                    isSearchInputFocused = false;
                    const viewArea = document.getElementById('main-view-area');
                    if (viewArea) {
                        viewArea.innerHTML = `<div id="search-view" style="padding-bottom: 60px;"><div id="search-results-area"></div></div>`;
                    }
                    renderSearchResults();
                    updateSearchSelection();
                } else if (selectedId === 'menu-follow') {
                    renderFollowScreen();
                } else {
                    loadContent();
                }
                return;
            }

            if (!channelViewData) return; // Prevent crashes if channel failed to load

            if (channelViewActiveRow === 0) {
                // VODs
                if (e.keyCode === 40) { channelViewActiveRow = 1; updateChannelSelection(); }
                else if (e.keyCode === 39) {
                    if (channelViewActiveCol < channelViewData.vods.length - 1) {
                        channelViewActiveCol++;
                        channelViewColIndices[0] = channelViewActiveCol;
                        updateChannelSelection();
                    }
                } else if (e.keyCode === 37) {
                    if (channelViewActiveCol > 0) {
                        channelViewActiveCol--;
                        channelViewColIndices[0] = channelViewActiveCol;
                        updateChannelSelection();
                    }
                } else if (e.keyCode === 13) {
                    const item = channelViewData.vods[channelViewActiveCol];
                    if (item.isLiveItem) {
                        openNativePlayer(item.user_name || item.user_login, item.user_id);
                    } else {
                        window.open(item.url, '_blank');
                    }
                }
            } else if (channelViewActiveRow === 1) {
                // Filters
                if (e.keyCode === 38) { 
                    if (channelViewData.vods.length > 0) {
                        channelViewActiveRow = 0; 
                        channelViewActiveCol = channelViewColIndices[0] || 0; 
                        updateChannelSelection(); 
                    }
                }
                else if (e.keyCode === 40 && channelViewData.clips.length > 0) { channelViewActiveRow = 2; channelViewActiveCol = channelViewColIndices[2] || 0; updateChannelSelection(); }
                else if (e.keyCode === 39) { if (channelClipFilterIdx < 1) channelClipFilterIdx++; updateChannelSelection(); }
                else if (e.keyCode === 37) { if (channelClipFilterIdx > 0) channelClipFilterIdx--; updateChannelSelection(); }
                else if (e.keyCode === 13) {
                    channelClipFilter = channelClipFilterIdx === 0 ? '7d' : '30d';
                    openChannelView(channelViewData.user.login, true);
                }
            } else if (channelViewActiveRow === 2) {
                // Clips
                if (e.keyCode === 38) { channelViewActiveRow = 1; updateChannelSelection(); }
                else if (e.keyCode === 39) {
                    if (channelViewActiveCol < channelViewData.clips.length - 1) {
                        channelViewActiveCol++;
                        channelViewColIndices[2] = channelViewActiveCol;
                        updateChannelSelection();
                    }
                } else if (e.keyCode === 37) {
                    if (channelViewActiveCol > 0) {
                        channelViewActiveCol--;
                        channelViewColIndices[2] = channelViewActiveCol;
                        updateChannelSelection();
                    }
                } else if (e.keyCode === 13) {
                    const item = channelViewData.clips[channelViewActiveCol];
                    window.open(item.url, '_blank');
                }
            }
            return;
        }
        if (inCategoryView) {
            // BACK BUTTON (Backspace=8, Escape=27, LG/Samsung Return=461/10009)
            if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
                inCategoryView = false;
                const menuItems = document.querySelectorAll('.menu-item');
                const selectedId = menuItems[currentFocusIndex].id;
                if (selectedId === 'menu-search') {
                    inMenu = false;
                    isSearchInputFocused = false;
                    const viewArea = document.getElementById('main-view-area');
                    if (viewArea) {
                        viewArea.innerHTML = `<div id="search-view" style="padding-bottom: 60px;"><div id="search-results-area"></div></div>`;
                    }
                    renderSearchResults();
                    updateSearchSelection();
                } else if (selectedId === 'menu-home') {
                    renderHome();
                } else {
                    loadContent();
                }
                return;
            }

            if (categoryDataRows.length === 0) return; // Prevent crashes if category failed to load

            if (categoryActiveRow === -1) {
                if (e.keyCode === 39) { if (categoryFilterIdx < 3) categoryFilterIdx++; renderCategoryView(); }
                else if (e.keyCode === 37) { if (categoryFilterIdx > 0) categoryFilterIdx--; renderCategoryView(); }
                else if (e.keyCode === 40) { categoryActiveRow = 0; categoryActiveCol = categoryColIndices[0] || 0; renderCategoryView(); }
                else if (e.keyCode === 13) {
                    if (categoryFilterIdx === 0) categoryFilters.it = !categoryFilters.it;
                    if (categoryFilterIdx === 1) categoryFilters.en = !categoryFilters.en;
                    if (categoryFilterIdx === 2) clipPeriod = '7d';
                    if (categoryFilterIdx === 3) clipPeriod = '30d';
                    openCategoryView(currentCategoryData, true);
                }
                return;
            }

            if (e.keyCode === 39) {
                if (categoryActiveCol < categoryDataRows[categoryActiveRow].data.length - 1) {
                    categoryActiveCol++;
                    categoryColIndices[categoryActiveRow] = categoryActiveCol;
                    updateCategorySelection();
                }
            } else if (e.keyCode === 37) {
                if (categoryActiveCol > 0) {
                    categoryActiveCol--;
                    categoryColIndices[categoryActiveRow] = categoryActiveCol;
                    updateCategorySelection();
                }
            } else if (e.keyCode === 40) {
                if (categoryActiveRow < categoryDataRows.length - 1) {
                    categoryActiveRow++;
                    categoryActiveCol = categoryColIndices[categoryActiveRow] || 0;
                    if (categoryActiveCol >= categoryDataRows[categoryActiveRow].data.length) {
                        categoryActiveCol = categoryDataRows[categoryActiveRow].data.length - 1;
                    }
                    updateCategorySelection();
                }
            } else if (e.keyCode === 38) {
                if (categoryActiveRow > 0) {
                    categoryActiveRow--;
                    categoryActiveCol = categoryColIndices[categoryActiveRow] || 0;
                    if (categoryActiveCol >= categoryDataRows[categoryActiveRow].data.length) {
                        categoryActiveCol = categoryDataRows[categoryActiveRow].data.length - 1;
                    }
                    updateCategorySelection();
                } else {
                    categoryActiveRow = -1;
                    renderCategoryView();
                }
            } else if (e.keyCode === 13) {
                const item = categoryDataRows[categoryActiveRow].data[categoryActiveCol];
                if (categoryDataRows[categoryActiveRow].type === 'stream') {
                    openNativePlayer(item.user_name || item.user_login, item.user_id);
                } else if (categoryDataRows[categoryActiveRow].type === 'clip') {
                    window.open(item.url, '_blank');
                }
            }
            return;
        }
        if (selectedId === 'menu-search') {
            // BACK BUTTON from results: go back to search bar
            if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
                isSearchInputFocused = true;
                searchActiveRow = -1;
                updateNav();
                updateSearchSelection();
                return;
            }

            if (searchDataRows.length === 0 || searchActiveRow < 0) {
                // If we are here and press Up, go back to search bar anyway
                if (e.keyCode === 38) {
                    isSearchInputFocused = true;
                    updateNav();
                }
                return;
            }
            const currentRow = searchDataRows[searchActiveRow];
            if (e.keyCode === 39) {
                if (searchActiveCol < currentRow.data.length - 1) { searchActiveCol++; updateSearchSelection(); }
            } else if (e.keyCode === 37) {
                if (searchActiveCol > 0) { searchActiveCol--; updateSearchSelection(); }
            } else if (e.keyCode === 40) {
                if (searchActiveRow < searchDataRows.length - 1) {
                    searchActiveRow++;
                    searchActiveCol = 0;
                    updateSearchSelection();
                }
            } else if (e.keyCode === 38) {
                if (searchActiveRow > 0) {
                    searchActiveRow--;
                    searchActiveCol = 0;
                    updateSearchSelection();
                } else {
                    isSearchInputFocused = true;
                    searchActiveRow = -1;
                    updateSearchSelection();
                    updateNav();
                }
            } else if (e.keyCode === 13) {
                const item = currentRow.data[searchActiveCol];
                if (currentRow.type === 'category') {
                    openCategoryView(item);
                } else {
                    const login = item.broadcaster_login || item.user_login || item.display_name;
                    openChannelView(login);
                }
            }
        } else if (selectedId === 'menu-home') {
            const currentRowData = homeDataRows[activeRow];
            if (!currentRowData) return;
            const currentLen = currentRowData.data.length;

            if (e.keyCode === 39) { // Right
                colIndices[activeRow]++;
                if (currentRowData.isHero) {
                    updateHomeSelection();
                    if (colIndices[activeRow] >= originalHeroCount * 2) {
                        setTimeout(() => {
                            if (colIndices[activeRow] >= originalHeroCount * 2) {
                                const rowDiv = document.getElementById(`row-${activeRow}`);
                                if (rowDiv) {
                                    const cards = rowDiv.querySelectorAll('.channel-card');
                                    rowDiv.style.transition = 'none';
                                    cards.forEach(c => c.style.transition = 'none');
                                    colIndices[activeRow] -= originalHeroCount;
                                    updateHomeSelection();
                                    rowDiv.offsetHeight; // force reflow
                                    rowDiv.style.transition = '';
                                    cards.forEach(c => c.style.transition = '');
                                }
                            }
                        }, 750);
                    }
                } else if (colIndices[activeRow] >= currentLen) {
                    colIndices[activeRow] = currentLen - 1;
                    updateHomeSelection();
                } else { updateHomeSelection(); }
            }
            if (e.keyCode === 37) { // Left
                colIndices[activeRow]--;
                if (currentRowData.isHero) {
                    if (colIndices[activeRow] < 0) colIndices[activeRow] = 0;
                    updateHomeSelection();
                    if (colIndices[activeRow] < originalHeroCount) {
                        setTimeout(() => {
                            if (colIndices[activeRow] < originalHeroCount) {
                                const rowDiv = document.getElementById(`row-${activeRow}`);
                                if (rowDiv) {
                                    const cards = rowDiv.querySelectorAll('.channel-card');
                                    rowDiv.style.transition = 'none';
                                    cards.forEach(c => c.style.transition = 'none');
                                    colIndices[activeRow] += originalHeroCount;
                                    updateHomeSelection();
                                    rowDiv.offsetHeight; // force reflow
                                    rowDiv.style.transition = '';
                                    cards.forEach(c => c.style.transition = '');
                                }
                            }
                        }, 750);
                    }
                } else if (colIndices[activeRow] < 0) {
                    colIndices[activeRow] = 0;
                    updateHomeSelection();
                } else { updateHomeSelection(); }
            }
            if (e.keyCode === 40 && activeRow < homeDataRows.length - 1) { activeRow++; updateHomeSelection(); }
            if (e.keyCode === 38) { if (activeRow > 0) { activeRow--; updateHomeSelection(); } else { inMenu = true; updateNav(); updateHomeSelection(); } }
            if (e.keyCode === 13) {
                if (currentRowData.type === 'category') {
                    const selectedCategory = currentRowData.data[colIndices[activeRow]];
                    openCategoryView(selectedCategory);
                } else if (currentRowData.type === 'stream') {
                    const selectedStream = currentRowData.data[colIndices[activeRow]];
                    openNativePlayer(selectedStream.user_name || selectedStream.user_login, selectedStream.user_id);
                }
            }
            if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
                showExitMenu();
                return;
            }
        } else if (selectedId === 'menu-follow') {
            if (followDataRows.length === 0) return;
            const currentRowData = followDataRows[followActiveRow];
            if (currentRowData.type === 'empty') {
                if (e.keyCode === 38) { inMenu = true; updateNav(); updateFollowSelection(); }
                return;
            }
            if (e.keyCode === 39) {
                if (followActiveCol < currentRowData.data.length - 1) followActiveCol++;
                updateFollowSelection();
            } else if (e.keyCode === 37) {
                if (followActiveCol > 0) followActiveCol--;
                updateFollowSelection();
            } else if (e.keyCode === 40) {
                if (followActiveRow < followDataRows.length - 1) {
                    followActiveRow++;
                    if (followActiveCol >= followDataRows[followActiveRow].data.length) {
                        followActiveCol = followDataRows[followActiveRow].data.length - 1;
                    }
                    updateFollowSelection();
                }
            } else if (e.keyCode === 38) {
                if (followActiveRow > 0) {
                    followActiveRow--;
                    if (followActiveCol >= followDataRows[followActiveRow].data.length) {
                        followActiveCol = followDataRows[followActiveRow].data.length - 1;
                    }
                    updateFollowSelection();
                } else {
                    inMenu = true; updateNav(); updateFollowSelection();
                }
            } else if (e.keyCode === 13) {
                if (currentRowData.type === 'stream') {
                    const selectedStream = currentRowData.data[followActiveCol];
                    openChannelView(selectedStream.user_name || selectedStream.user_login);
                } else if (currentRowData.type === 'avatars') {
                    const selectedAvatar = currentRowData.data[followActiveCol];
                    openChannelView(selectedAvatar.login);
                }
            }
        } else if (selectedId === 'menu-settings') {
            if (e.keyCode === 39 && settingsCol[settingsRow] < 1) { settingsCol[settingsRow]++; showSettingsScreen(); }
            else if (e.keyCode === 37 && settingsCol[settingsRow] > 0) { settingsCol[settingsRow]--; showSettingsScreen(); }
            else if (e.keyCode === 40 && settingsRow < 2) { settingsRow++; showSettingsScreen(); }
            else if (e.keyCode === 38) { if (settingsRow > 0) { settingsRow--; showSettingsScreen(); } else { inMenu = true; updateNav(); showSettingsScreen(); } }
            else if (e.keyCode === 13) {
                if (settingsRow === 0) appSettings.barPos = settingsCol[0] === 0 ? 'center' : 'left';
                else if (settingsRow === 1) appSettings.theme = settingsCol[1] === 0 ? 'dark' : 'light';
                else if (settingsRow === 2) appSettings.performanceMode = settingsCol[2] === 0;
                saveSettings(); showSettingsScreen(); setTimeout(updateNav, 50);
            }
        } else if (selectedId === 'menu-profile') {
            if (e.keyCode === 38) { inMenu = true; updateNav(); showProfileScreen(); }
            if (e.keyCode === 13 && userToken) { logout(); inMenu = true; updateNav(); }
        }
    }
}

// --- MOTORE NATIVE PLAYER (GraphQL + HLS) ---
async function getStreamM3u8(channel) {
    // 1. Usa il client-id pubblico Web di Twitch per bypassare blocchi OAuth sullo streaming
    const gqlBody = {
        operationName: 'PlaybackAccessToken_Template',
        query: `query PlaybackAccessToken_Template($login: String!, $isLive: Boolean!, $vodID: ID!, $isVod: Boolean!, $playerType: String!) {  streamPlaybackAccessToken(channelName: $login, params: {platform: "web", playerBackend: "mediaplayer", playerType: $playerType}) { value signature } }`,
        variables: { isLive: true, login: channel, isVod: false, vodID: '', playerType: 'site' }
    };

    const tokenRes = await fetch('https://gql.twitch.tv/gql', {
        method: 'POST',
        headers: { 'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko', 'Content-Type': 'application/json' },
        body: JSON.stringify(gqlBody)
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.data || !tokenData.data.streamPlaybackAccessToken) return null;

    const { value, signature } = tokenData.data.streamPlaybackAccessToken;

    // 2. Componi e Leggi il file M3U8 Master da Usher
    const m3u8Url = `https://usher.ttvnw.net/api/channel/hls/${channel}.m3u8?allow_source=true&fast_bread=true&sig=${signature}&token=${encodeURIComponent(value)}`;
    const m3u8Res = await fetch(m3u8Url);
    const m3u8Text = await m3u8Res.text();

    // 3. Estrai le varianti (Risoluzioni)
    const lines = m3u8Text.split('\n');
    const streams = [{ name: 'Auto', url: m3u8Url }]; // La prima è sempre l'Auto nativa
    let currentName = null;

    lines.forEach(line => {
        if (line.startsWith('#EXT-X-STREAM-INF')) {
            const nameMatch = line.match(/VIDEO="([^"]+)"/);
            currentName = nameMatch ? nameMatch[1] : 'Unknown';
        } else if (line.startsWith('http') && currentName) {
            streams.push({ name: currentName, url: line });
            currentName = null;
        }
    });
    return streams;
}

async function openNativePlayer(channelName, channelId) {
    inPlayer = true;
    currentStreamChannel = channelName;
    currentStreamId = channelId;
    document.getElementById('player-container').style.display = 'block';
    document.body.classList.add('player-active');

    qualityOptions = await getStreamM3u8(channelName);
    if (!qualityOptions || qualityOptions.length === 0) {
        closeNativePlayer(); return;
    }

    playVideoUrl(qualityOptions[0].url); // Fai partire "Auto"
    document.getElementById('twitch-chat').src = `https://www.twitch.tv/embed/${channelName}/chat?parent=localhost&darkpopout`;

    showPlayerUI();
    updatePlayerFocus();
}

function playVideoUrl(url) {
    try {
        webapis.avplay.stop();
        webapis.avplay.close();
    } catch (e) { }

    try {
        webapis.avplay.open(url);
        webapis.avplay.setDisplayRect(0, 0, 1920, 1080); // Risoluzione standard TV

        webapis.avplay.prepareAsync(function () {
            webapis.avplay.play();
            isPlaying = true;
            document.getElementById('icon-pause').style.display = 'block';
            document.getElementById('icon-play').style.display = 'none';
        }, function (error) {
            console.error("AVPlay prepare error: " + error);
        });
    } catch (e) {
        console.error("AVPlay open error: ", e);
    }
}

function closeNativePlayer() {
    inPlayer = false;

    // Chiusura aggressiva vitale per Smart TV AVPlay
    try {
        webapis.avplay.stop();
        webapis.avplay.close();
    } catch (e) { console.error('AVPlay close error', e); }

    document.body.classList.remove('player-active');
    document.getElementById('player-container').style.display = 'none';
    document.getElementById('twitch-chat').src = '';
    isChatOpen = false; document.getElementById('twitch-chat').style.display = 'none';
    isQualityMenuOpen = false; document.getElementById('quality-menu').style.display = 'none';
    clearTimeout(uiTimeout);
}

function showPlayerUI() {
    const ui = document.getElementById('player-ui');
    ui.classList.remove('hidden');
    clearTimeout(uiTimeout);
    uiTimeout = setTimeout(() => {
        if (!isQualityMenuOpen) ui.classList.add('hidden');
    }, 4000);
}

function updatePlayerFocus() {
    if (isQualityMenuOpen) {
        document.querySelectorAll('.quality-item').forEach((el, i) => {
            el.classList.toggle('focused', i === qualityFocusIndex);
        });
        return;
    }
    playerBtns.forEach((id, i) => document.getElementById(id).classList.toggle('focused', i === playerFocusIndex));
}

function showExitMenu() {
    inExitMenu = true;
    exitMenuFocusIdx = 0; // Default to 'Annulla'
    const menuContainer = document.getElementById('exit-menu-container');
    if (menuContainer) {
        menuContainer.classList.remove('hidden');
    }
    updateExitMenuFocus();
}

function hideExitMenu() {
    inExitMenu = false;
    const menuContainer = document.getElementById('exit-menu-container');
    if (menuContainer) {
        menuContainer.classList.add('hidden');
    }
    // Re-focus current home selection when returning
    updateHomeSelection();
}

function updateExitMenuFocus() {
    const btnCancel = document.getElementById('btn-exit-cancel');
    const btnConfirm = document.getElementById('btn-exit-confirm');
    
    if (btnCancel) btnCancel.classList.toggle('focused', exitMenuFocusIdx === 0);
    if (btnConfirm) btnConfirm.classList.toggle('focused', exitMenuFocusIdx === 1);
}