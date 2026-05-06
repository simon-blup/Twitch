const CLIENT_ID = '9g8h4ha9stbc9r76624evvlx4bzk39';
let userToken = localStorage.getItem('twitch_access_token') || '';
let refreshToken = localStorage.getItem('twitch_refresh_token') || '';
let userId = localStorage.getItem('twitch_user_id') || '';

// Default barPos is 'center'
let appSettings = JSON.parse(localStorage.getItem('twitch_settings')) || { barPos: 'center', theme: 'dark', performanceMode: false };

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

// Per gestire Category View
let inCategoryView = false;
let categoryDataRows = [];
let categoryActiveRow = 0;
let categoryActiveCol = 0;
let currentCategoryData = null;
let categoryFilters = { it: true, en: true };
let categoryFilterIdx = 0;
let clipPeriod = '7d';

window.onload = async function () {
    applySettings();
    if (userToken) {
        try {
            const valRes = await fetch('https://id.twitch.tv/oauth2/validate', {
                headers: { 'Authorization': 'OAuth ' + userToken }
            });
            if (valRes.status === 401) {
                await validateOrRefreshToken();
            } else {
                const valData = await valRes.json();
                if (valData.user_id) {
                    userId = valData.user_id;
                    localStorage.setItem('twitch_user_id', userId);
                }
            }
        } catch (e) { console.error("Validation failed", e); }
        
        if (!userId && userToken) await fetchUserId();
    }
    updateNav();
    loadContent();
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let searchTimeout = null;
        searchInput.addEventListener('input', function() {
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

    if (selectedId === 'menu-search') {
        searchDataRows = [];
        searchActiveRow = -1;
        searchActiveCol = 0;
        isSearchInputFocused = false;
        if (viewArea) {
            viewArea.innerHTML = `
                <div id="search-view" style="padding-bottom: 60px;">
                    <div id="search-results-area"></div>
                </div>`;
        }
        return;
    }

    if (selectedId === 'menu-home') {
        inCategoryView = false;
        if (appSettings.performanceMode) {
            // In performance mode, skip home, go to follow
            const menuItems2 = document.querySelectorAll('.menu-item');
            for (let i = 0; i < menuItems2.length; i++) {
                if (menuItems2[i].id === 'menu-follow') { currentFocusIndex = i; break; }
            }
            updateNav();
            followActiveRow = 0;
            followActiveCol = 0;
            await getFollowData();
            return;
        }
        activeRow = 0;
        await getTwitchHome();
    } else if (selectedId === 'menu-follow') {
        followActiveRow = 0;
        followActiveCol = 0;
        await getFollowData();
    } else if (selectedId === 'menu-settings') {
        settingsRow = 0;
        settingsCol = [
            appSettings.barPos === 'center' ? 0 : 1,
            appSettings.theme === 'dark' ? 0 : 1,
            appSettings.performanceMode ? 0 : 1
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
            const catPromises = catRes.data.map(async (cat) => {
                try {
                    const stRes = await twitchFetch(`https://api.twitch.tv/helix/streams?game_id=${cat.id}&first=100`);
                    let viewers = 0;
                    if (stRes && stRes.data) {
                        viewers = stRes.data.reduce((sum, stream) => sum + stream.viewer_count, 0);
                    }
                    cat.viewer_count = viewers;
                } catch(e) { cat.viewer_count = 0; }
                return cat;
            });
            await Promise.all(catPromises);
            homeDataRows.push({ title: "Categories", type: "category", data: catRes.data });
        }

        colIndices = new Array(homeDataRows.length).fill(0);
        if (homeDataRows[0] && homeDataRows[0].isHero) {
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

    let html = '<div id="home-view" style="padding-bottom:60px;">';
    homeDataRows.forEach((row, rowIndex) => {
        if (row.title) {
            html += `<h3 style="color:${titleColor}; margin-left:80px; margin-bottom:30px; font-size:26px;">${row.title}</h3>`;
        }
        const gridClass = row.type === 'login_btn' ? 'full-page-screen' : (row.isHero ? 'channel-grid hero-grid' : 'channel-grid');
        const wrapperStyle = row.type === 'login_btn' ? '' : 'width:100%; overflow:visible; perspective:1200px; margin-bottom:40px;';
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

        if (row.type === 'login_btn') {
            const card = document.createElement('div');
            card.className = 'login-btn';
            card.innerHTML = 'Go to Profile to Log In';
            rowDiv.appendChild(card);
        } else if (row.type === 'category') {
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
            c.classList.remove('selected', 'hero-adjacent', 'hero-center');
            if (row.isHero) {
                if (i === currentColIdx) {
                    c.classList.add('hero-center');
                    if (isActiveRow) c.classList.add('selected');
                }
                else if (i === currentColIdx - 1 || i === currentColIdx + 1) c.classList.add('hero-adjacent');
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
    
    let html = '<div id="follow-view" style="padding-top:20px; padding-bottom:60px; display:flex; flex-direction:column; align-items:center; gap:20px;">';
    followDataRows.forEach((row, rowIndex) => {
        if (row.type === 'login_btn') {
            html += `
            <div class="full-page-screen">
                <div class="login-btn ${!inMenu ? 'focused' : ''}">Go to Profile to Log In</div>
            </div>`;
        } else if (row.type === 'empty') {
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
        }
        const rowEl = document.getElementById(`follow-row-${followActiveRow}`);
        if (rowEl) {
            rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
            <div class="full-page-screen">
                <div class="login-btn ${!inMenu ? 'focused' : ''}">Go to Profile to Log In</div>
            </div>`;
        return;
    }

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
                    <div class="logout-btn ${!inMenu ? 'focused' : ''}" style="margin-top: 0;">PRESS ENTER TO LOG OUT</div>
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
            if (isSearchInputFocused) {
                setTimeout(() => { searchInput.focus(); }, 100);
            } else {
                searchInput.blur();
            }
        } else {
            searchDropdown.classList.remove('search-open');
            searchInput.blur();
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
        const [chRes, catRes] = await Promise.all([
            twitchFetch(`https://api.twitch.tv/helix/search/channels?query=${encodeURIComponent(query)}&first=20`),
            twitchFetch(`https://api.twitch.tv/helix/search/categories?query=${encodeURIComponent(query)}&first=10`)
        ]);

        const channels = chRes.data || [];
        const categories = catRes.data || [];

        const liveChannels = channels.filter(c => c.is_live);
        const allChannels = channels; // Metti pure quelli in live

        let liveStreams = [];
        if (liveChannels.length > 0) {
            const userIds = liveChannels.map(c => `user_id=${c.id}`).join('&');
            try {
                const streamRes = await twitchFetch(`https://api.twitch.tv/helix/streams?${userIds}`);
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
                } catch(e) { cat.viewer_count = 0; }
                return cat;
            });
            await Promise.all(catPromises);
            popularCategories = categories.filter(c => c.viewer_count >= 100);
        }

        if (allChannels.length > 0) {
            const followerPromises = allChannels.map(async (c) => {
                try {
                    const folRes = await twitchFetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${c.id}`);
                    c.follower_count = folRes.total || 0;
                } catch(e) {
                    c.follower_count = 0;
                }
                return c;
            });
            await Promise.all(followerPromises);
            allChannels.sort((a, b) => b.follower_count - a.follower_count);
        }

        searchDataRows = [];
        if (liveStreams.length > 0) searchDataRows.push({ title: 'Canali Live', type: 'live', data: liveStreams });
        if (popularCategories.length > 0) searchDataRows.push({ title: 'Categorie', type: 'category', data: popularCategories });
        if (allChannels.length > 0) searchDataRows.push({ title: 'Canali', type: 'channel', data: allChannels });

        if (searchDataRows.length === 0) {
            resultsArea.innerHTML = `<div style="text-align:center; padding-top:60px; color:#adadb8; font-size:24px;">Nessun risultato per "${query}"</div>`;
            return;
        }
        
        searchActiveRow = -1; 
        searchActiveCol = 0;
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

    let html = `<div style="padding: 0 0 80px 0;">`;
    searchDataRows.forEach((row, rIdx) => {
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
                let viewersHtml = '';
                if (item.viewer_count !== undefined) {
                    viewersHtml = `<div class="badge-viewers">${formatViewers(item.viewer_count)}</div>`;
                }
                html += `
                    <div class="category-card ${selClass}" id="search-card-${rIdx}-${cIdx}" style="flex-shrink:0;">
                        ${viewersHtml}
                        <img src="${box.replace('{width}','300').replace('{height}','400')}" style="width:100%; height:100%; object-fit:cover;">
                        <div class="card-info"><div style="font-size:20px; font-weight:bold; color:white;">${item.name}</div></div>
                    </div>`;
            } else if (row.type === 'channel') {
                const thumb = item.thumbnail_url || '';
                html += `
                    <div class="search-channel-card ${selClass}" id="search-card-${rIdx}-${cIdx}" style="flex-shrink:0; width:350px;">
                        <img src="${thumb.replace('{width}','150').replace('{height}','150')}" class="search-avatar">
                        <div class="search-info">
                            <div class="search-name">${item.display_name}</div>
                            <div class="search-game">${item.game_name || 'Offline'}</div>
                        </div>
                    </div>`;
            }
        });
        html += `</div></div>`;
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
    
    let boxThumb = currentCategoryData.box_art_url.replace('{width}','285').replace('{height}','380');
    let bgThumb = currentCategoryData.box_art_url.replace('{width}','1200').replace('{height}','1200');
    let viewers = formatViewers(currentCategoryData.viewer_count || 0);
    
    let html = `
        <div id="category-view" style="padding-bottom:60px; position:relative;">
            
            <div style="position:absolute; top:0; left:0; width:100%; height:450px; 
                        background-image:url('${bgThumb}'); 
                        background-size:cover; 
                        background-position:center 20%; 
                        filter:blur(30px); 
                        opacity:0.15; 
                        z-index:-1;
                        mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%);
                        -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%);">
            </div>
            
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
                let thumb = item.thumbnail_url.replace('{width}','800').replace('{height}','450');
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
                    <div class="badge-viewers">${formatViewers(item.view_count)} views</div>
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
        
        let targetColIdx = (rowIndex === categoryActiveRow) ? categoryActiveCol : 0;
        let cardWidth = 440 + 20;
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
        if (inCategoryView) {
            // BACK BUTTON (Backspace=8, Escape=27, LG/Samsung Return=461/10009)
            if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
                inCategoryView = false;
                renderHome();
                return;
            }

            if (categoryActiveRow === -1) {
                if (e.keyCode === 39) { if (categoryFilterIdx < 3) categoryFilterIdx++; renderCategoryView(); }
                else if (e.keyCode === 37) { if (categoryFilterIdx > 0) categoryFilterIdx--; renderCategoryView(); }
                else if (e.keyCode === 40) { categoryActiveRow = 0; categoryActiveCol = 0; renderCategoryView(); }
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
                if (categoryActiveCol < categoryDataRows[categoryActiveRow].data.length - 1) categoryActiveCol++;
                updateCategorySelection();
            } else if (e.keyCode === 37) {
                if (categoryActiveCol > 0) categoryActiveCol--;
                updateCategorySelection();
            } else if (e.keyCode === 40) {
                if (categoryActiveRow < categoryDataRows.length - 1) {
                    categoryActiveRow++;
                    categoryActiveCol = 0;
                    updateCategorySelection();
                }
            } else if (e.keyCode === 38) {
                if (categoryActiveRow > 0) {
                    categoryActiveRow--;
                    categoryActiveCol = 0;
                    updateCategorySelection();
                } else {
                    categoryActiveRow = -1;
                    renderCategoryView();
                }
            } else if (e.keyCode === 13) {
                const item = categoryDataRows[categoryActiveRow].data[categoryActiveCol];
                if (categoryDataRows[categoryActiveRow].type === 'stream') {
                    window.open(`https://www.twitch.tv/${item.user_name}`, '_blank');
                } else if (categoryDataRows[categoryActiveRow].type === 'clip') {
                    window.open(item.url, '_blank');
                }
            }
            return;
        }
        if (selectedId === 'menu-search') {
            if (searchDataRows.length === 0 || searchActiveRow < 0) return;
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
                    window.open(`https://www.twitch.tv/${login}`, '_blank');
                }
            }
        } else if (selectedId === 'menu-home') {
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
            if (e.keyCode === 13) {
                if (currentRowData.type === 'login_btn') {
                    currentFocusIndex = 4; inMenu = true; updateNav(); loadContent();
                } else if (currentRowData.type === 'category') {
                    const selectedCategory = currentRowData.data[colIndices[activeRow]];
                    openCategoryView(selectedCategory);
                } else if (currentRowData.type === 'stream') {
                    const selectedStream = currentRowData.data[colIndices[activeRow]];
                    window.open(`https://www.twitch.tv/${selectedStream.user_name}`, '_blank');
                }
            }
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
            }
        } else if (selectedId === 'menu-settings') {
            if (!userToken) {
                if (e.keyCode === 13) { currentFocusIndex = 4; inMenu = true; updateNav(); loadContent(); }
                if (e.keyCode === 38) { inMenu = true; updateNav(); showSettingsScreen(); }
                return;
            }
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
            if (e.keyCode === 13 && userToken) { localStorage.removeItem('twitch_access_token'); localStorage.removeItem('twitch_refresh_token'); localStorage.removeItem('twitch_user_id'); userToken = ''; refreshToken = ''; userId = ''; inMenu = true; updateNav(); loadContent(); }
        }
    }
}