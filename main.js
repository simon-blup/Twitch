const CLIENT_ID = '9g8h4ha9stbc9r76624evvlx4bzk39';

// Gestione Multi-Profilo
let allProfiles = JSON.parse(localStorage.getItem('twitch_profiles')) || [];
let activeProfileId = localStorage.getItem('active_profile_id') || '';

let isProfileSelectionOnStartup = allProfiles.length > 0; // True if we have accounts to choose from

let userToken = '';
let refreshToken = '';
let userId = '';

// Carica il profilo attivo all'avvio
function loadActiveProfile() {
    if (isProfileSelectionOnStartup) {
        userToken = '';
        refreshToken = '';
        userId = '';
        return;
    }
    const profile = allProfiles.find(p => p.id === activeProfileId) || allProfiles[0];
    if (profile) {
        userToken = profile.token;
        refreshToken = profile.refresh;
        userId = profile.id;
        activeProfileId = profile.id;
        localStorage.setItem('active_profile_id', activeProfileId);
    } else {
        userToken = '';
        refreshToken = '';
        userId = '';
        activeProfileId = '';
    }
}
loadActiveProfile();

// --- VARIABILI PLAYER NATIVO ---
let inPlayer = false;
let uiTimeout = null;
let playerFocusIndex = 0; // 0: Play, 1: Quality, 2: Channel
const playerBtns = ['btn-play', 'btn-quality', 'btn-goto-channel'];
let isPlaying = true;
let isQualityMenuOpen = false;
let qualityOptions = [];
let qualityFocusIndex = 0;
let currentStreamChannel = "";
let currentStreamId = "";
let currentStreamTitle = "";

// Default barPos is 'center'
let appSettings = JSON.parse(localStorage.getItem('twitch_settings')) || { barPos: 'center', theme: 'dark', performanceMode: false, notifications: true, adBlock: true };
if (appSettings.notifications === undefined) appSettings.notifications = true;
if (appSettings.adBlock === undefined) appSettings.adBlock = true;

let lastLiveStreamIds = new Set();
let isFirstCheck = true;

let currentFocusIndex = 1; // 0: Search, 1: Home, 2: Follow, 3: Settings, 4: Profile
let inMenu = true;
let homeDataRows = [];
let activeRow = 0;
let colIndices = [];
let originalHeroCount = 0; // Per gestire il loop infinito della prima riga

// Per gestire i Settings
let settingsRow = 0;
let settingsTab = 0; // 0: Appearance, 1: System


// Navigation Race Condition & Animation Lock
let currentNavSequence = 0;
let twitchStatus = { text: 'Operational', color: '#44ff44' };
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
    
    // Assicuriamoci che i profili siano caricati prima di procedere
    loadActiveProfile();
    
    // Proactively clean expired profiles on startup
    await validateAndCleanProfiles();

    if (userToken) {
        await checkLoginStatus();
        if (!userId && userToken) await fetchUserId();
    }

    // Se non c'è un utente loggato, forza la visualizzazione della sezione Profilo (che mostrerà il codice)
    if (!userToken) {
        currentFocusIndex = 4; // Indice del menu Profilo
        inMenu = false;
        
        if (isProfileSelectionOnStartup && allProfiles.length > 0) {
            const activeIndex = allProfiles.findIndex(p => p.id === activeProfileId);
            if (activeIndex !== -1) {
                profileActiveCol = activeIndex;
            }
        }
    }
    
    await loadContent();
    updateNav();
    fetchTwitchStatus();

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

    // Notification polling every 20 seconds
    setInterval(checkLiveFollowedStreams, 20000);
    // Initial check after 5 seconds to populate the list without showing notifications for everyone already live
    setTimeout(checkLiveFollowedStreams, 5000);
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
            
            // Fix: Update multi-profile array instead of legacy localstorage
            if (activeProfileId) {
                const profIndex = allProfiles.findIndex(p => p.id === activeProfileId);
                if (profIndex !== -1) {
                    allProfiles[profIndex].token = userToken;
                    allProfiles[profIndex].refresh = refreshToken;
                    localStorage.setItem('twitch_profiles', JSON.stringify(allProfiles));
                }
            }
            
            console.log("Token aggiornato con successo!");
        } else {
            await logout();
        }
    } catch (error) {
        console.error("Errore durante il refresh:", error);
        await logout();
    }
}

function getThumbSize(type) {
    if (appSettings.performanceMode) {
        if (type === 'stream') return { w: 400, h: 225 };
        if (type === 'category') return { w: 150, h: 200 };
    }
    if (type === 'stream') return { w: 800, h: 450 };
    if (type === 'category') return { w: 300, h: 400 };
    return { w: 600, h: 338 }; // default
}

function getSafeThumb(url, type) {
    if (!url) return 'icon.png';
    const size = getThumbSize(type);
    return url.replace('{width}', size.w).replace('{height}', size.h)
              .replace('%{width}', size.w).replace('%{height}', size.h);
}

async function logout() {
    localStorage.removeItem('twitch_access_token');
    localStorage.removeItem('twitch_refresh_token');
    localStorage.removeItem('twitch_user_id');
    
    // Auto-remove the invalid profile
    if (activeProfileId) {
        allProfiles = allProfiles.filter(p => p.id !== activeProfileId);
        localStorage.setItem('twitch_profiles', JSON.stringify(allProfiles));
        
        if (allProfiles.length > 0) {
            activeProfileId = allProfiles[0].id;
            localStorage.setItem('active_profile_id', activeProfileId);
        } else {
            activeProfileId = '';
        }
    }

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

        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = '';

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
        activeRow = 0;
        await getTwitchHome(mySeq);
    } else if (selectedId === 'menu-follow') {
        followActiveRow = 0;
        followActiveCol = 0;
        await getFollowData(mySeq);
    } else if (selectedId === 'menu-settings') {
        settingsRow = -1; // -1 indicates focus is on the tabs
        settingsTab = 0;
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
                let thumb = getSafeThumb(item.box_art_url, 'category');

                card.innerHTML = `
                    <img src="${thumb}" loading="lazy" onerror="this.src='icon.png'" style="width:100%; height:100%; object-fit:cover;">
                    <div class="card-info"><div style="font-size:20px; font-weight:bold; color:white;">${item.name}</div></div>`;
                rowDiv.appendChild(card);
            });
        } else if (row.type === 'stream') {
            row.data.forEach((item) => {
                const card = document.createElement('div');
                card.className = row.isHero ? 'channel-card hero-card' : 'channel-card';
                let thumb = getSafeThumb(item.thumbnail_url, 'stream');
                const viewers = formatViewers(item.viewer_count);
                card.innerHTML = `
                    <div class="badge-live">LIVE</div>
                    <div class="badge-viewers">${viewers}</div>
                    <img src="${thumb}" loading="lazy" onerror="this.src='icon.png'" style="width:100%; height:100%; object-fit:cover;">
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
                let thumb = getSafeThumb(item.thumbnail_url, 'stream');
                const viewers = formatViewers(item.viewer_count);
                html += `
                    <div id="follow-card-${rowIndex}-${colIndex}" class="channel-card">
                        <div class="badge-live">LIVE</div>
                        <div class="badge-viewers">${viewers}</div>
                        <img src="${thumb}" loading="lazy" onerror="this.src='icon.png'" style="width:100%; height:100%; object-fit:cover;">
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

async function checkLiveFollowedStreams() {
    if (!userToken || !userId || !appSettings.notifications) return;
    try {
        const res = await twitchFetch(`https://api.twitch.tv/helix/streams/followed?user_id=${userId}&first=100`);
        const currentStreams = res.data || [];
        const currentIds = new Set(currentStreams.map(s => s.user_id));

        if (isFirstCheck) {
            lastLiveStreamIds = currentIds;
            isFirstCheck = false;
            return;
        }

        const newLiveStreams = currentStreams.filter(s => !lastLiveStreamIds.has(s.user_id));

        if (newLiveStreams.length > 0) {
            // Fetch profile images for new live streamers
            const userIds = newLiveStreams.map(s => `id=${s.user_id}`).join('&');
            const userRes = await twitchFetch(`https://api.twitch.tv/helix/users?${userIds}`);
            const userData = userRes.data || [];

            newLiveStreams.forEach(stream => {
                const user = userData.find(u => u.id === stream.user_id);
                const profileImg = user ? user.profile_image_url : null;
                showNotification(stream.user_name, stream.title, profileImg);
            });
        }

        lastLiveStreamIds = currentIds;
    } catch (e) {
        console.error("Error checking live followed streams:", e);
    }
}

function showNotification(userName, title, profileImg) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notif = document.createElement('div');
    notif.className = 'notification';

    let iconHtml = `
        <div class="notification-icon">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="white">
                <path d="M2.149 0l-1.612 4.119v16.836h5.731v3.045h3.224l3.045-3.045h4.657l6.269-6.269v-14.686h-21.314zm19.164 13.612l-3.582 3.582h-5.731l-3.045 3.045v-3.045h-4.836v-15.045h17.194v11.463zm-3.582-7.343v4.836h-2.149v-4.836h2.149zm-5.731 0v4.836h-2.149v-4.836h2.149z" />
            </svg>
        </div>`;

    if (profileImg) {
        iconHtml = `<img src="${profileImg}" class="notification-avatar">`;
    }

    notif.innerHTML = `
        ${iconHtml}
        <div class="notification-content">
            <div class="notification-title">${userName} is now LIVE!</div>
            <div class="notification-msg">${title}</div>
        </div>
    `;

    container.appendChild(notif);

    // Auto remove from DOM after animation
    setTimeout(() => {
        if (notif.parentNode) {
            notif.parentNode.removeChild(notif);
        }
    }, 6500);
}

function showSettingsScreen() {
    const viewArea = document.getElementById('main-view-area');
    if (!viewArea) return;
    const isLight = document.body.classList.contains('theme-light');
    const textColor = isLight ? '#000' : 'white';
    const inactiveColor = isLight ? '#555' : '#adadb8';
    const borderColor = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)';

    let contentHtml = '';

    if (settingsTab === 0) {
        // Appearance Tab
        contentHtml = `
            <div class="settings-container">
                <div class="settings-item ${(!inMenu && settingsRow === 0) ? 'focused' : ''}">
                    <div class="settings-label">Bar Position</div>
                    <div class="settings-switch-box">
                        <div class="settings-value-text" style="color: ${inactiveColor};">${appSettings.barPos === 'center' ? 'Center' : 'Left'}</div>
                        <div class="switch-track ${appSettings.barPos === 'center' ? 'active' : ''}">
                            <div class="switch-knob"></div>
                        </div>
                    </div>
                </div>

                <div class="settings-item ${(!inMenu && settingsRow === 1) ? 'focused' : ''}">
                    <div class="settings-label">Dark Theme</div>
                    <div class="settings-switch-box">
                        <div class="switch-track ${appSettings.theme === 'dark' ? 'active' : ''}">
                            <div class="switch-knob"></div>
                        </div>
                    </div>
                </div>

                <div class="settings-item ${(!inMenu && settingsRow === 2) ? 'focused' : ''}">
                    <div class="settings-label">Notifications</div>
                    <div class="settings-switch-box">
                        <div class="switch-track ${appSettings.notifications ? 'active' : ''}">
                            <div class="switch-knob"></div>
                        </div>
                    </div>
                </div>
            </div>`;
    } else {
        // System Tab
        contentHtml = `
            <div class="settings-container">
                <div class="settings-item ${(!inMenu && settingsRow === 0) ? 'focused' : ''}">
                    <div class="settings-label">Performance Mode</div>
                    <div class="settings-switch-box">
                        <div class="switch-track ${appSettings.performanceMode ? 'active' : ''}">
                            <div class="switch-knob"></div>
                        </div>
                    </div>
                </div>

                <div class="settings-item ${(!inMenu && settingsRow === 1) ? 'focused' : ''}">
                    <div class="settings-label">Ad Block (Proxy)</div>
                    <div class="settings-switch-box">
                        <div class="switch-track ${appSettings.adBlock ? 'active' : ''}">
                            <div class="switch-knob"></div>
                        </div>
                    </div>
                </div>

                <!-- Twitch Status (Not focusable) -->
                <div class="settings-item" style="cursor: default; opacity: 0.9; background: rgba(255,255,255,0.02); border-color: transparent;">
                    <div class="settings-label">Twitch Status</div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 12px; height: 12px; border-radius: 50%; background: ${twitchStatus.color || '#44ff44'}; box-shadow: 0 0 10px ${twitchStatus.color || '#44ff44'};"></div>
                        <div style="color: ${textColor}; font-weight: bold; font-size: 18px; text-transform: uppercase; opacity: 0.8;">${twitchStatus.text || 'All Systems Operational'}</div>
                    </div>
                </div>

                <div class="settings-item ${(!inMenu && settingsRow === 2) ? 'focused' : ''}" style="border-color: ${(!inMenu && settingsRow === 2) ? '#ff4f4f' : 'transparent'}; background: ${(!inMenu && settingsRow === 2) ? 'rgba(255,79,79,0.1)' : 'rgba(255, 255, 255, 0.05)'};">
                    <div class="settings-label" style="color: #ff4f4f;">Remove Account from List</div>
                </div>
            </div>`;
    }

    const getTabStyle = (tabIdx) => {
        let style = `display:flex; align-items:center; gap:12px; padding:15px 50px; font-size:26px; font-weight:bold; margin-bottom:-2px; transition:all 0.3s ease; border-radius:10px 10px 0 0; `;
        
        const isActive = settingsTab === tabIdx;
        const isFocused = (!inMenu && settingsRow === -1 && settingsTab === tabIdx);
        
        if (isActive) {
            style += `color:${textColor}; border-bottom: 4px solid #bf94ff; `;
        } else {
            style += `color:${inactiveColor}; border-bottom: 4px solid transparent; `;
        }
        
        if (isFocused) {
            style += `background:rgba(191,148,255,0.15); color:#bf94ff; `;
        }
        
        return style;
    };

    const appIcon = `<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M12 22C6.49 22 2 17.51 2 12S6.49 2 12 2s10 4.04 10 9c0 1.31-.83 2.67-2.12 3.12-.39.14-.79.35-.79.79 0 .21.14.47.38.83.21.31.43.68.43 1.26 0 2.21-3.58 5-7.9 5zM12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8c3.08 0 5.9-2.02 5.9-3 0-.17-.11-.42-.31-.73-.28-.43-.53-.8-.53-1.35 0-1.28.87-2.2 1.83-2.54.59-.21 1.11-.7 1.11-1.38 0-3.86-3.59-7-8-7z"/><circle cx="6.5" cy="11.5" r="1.5"/><circle cx="9.5" cy="7.5" r="1.5"/><circle cx="14.5" cy="7.5" r="1.5"/><circle cx="17.5" cy="11.5" r="1.5"/></svg>`;
    const sysIcon = `<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>`;

    viewArea.innerHTML = `
        <div class="full-page-screen" style="display:flex; flex-direction:column; align-items:center; justify-content:flex-start; padding-top:40px;">
            
            <!-- Tabs Menu -->
            <div style="display:flex; justify-content:center; width:80%; max-width:800px; border-bottom: 2px solid ${borderColor}; margin-bottom: 60px;">
                <div style="${getTabStyle(0)}">
                    ${appIcon} Appearance
                </div>
                <div style="${getTabStyle(1)}">
                    ${sysIcon} System
                </div>
            </div>

            <!-- Tab Content -->
            <div style="display:flex; flex-direction:column; gap:40px; width:100%;">
                ${contentHtml}
            </div>

        </div>`;
}

async function fetchTwitchStatus() {
    try {
        const res = await fetch('https://status.twitch.tv/api/v2/summary.json');
        const data = await res.json();
        if (data && data.status) {
            const indicator = data.status.indicator; // none, minor, major, critical
            let color = '#44ff44'; // green
            let text = data.status.description || 'All Systems Operational';
            
            if (indicator === 'minor') { color = '#ffcc00'; }
            else if (indicator === 'major') { color = '#ff9900'; }
            else if (indicator === 'critical') { color = '#ff4f4f'; }
            
            twitchStatus = { text, color };
            // If settings screen is open, refresh it
            const menuItems = document.querySelectorAll('.menu-item');
            if (menuItems[currentFocusIndex] && menuItems[currentFocusIndex].id === 'menu-settings') {
                showSettingsScreen();
            }
        }
    } catch (e) {
        console.warn("Failed to fetch Twitch Status:", e);
    }
}

let profileActiveCol = 0;
let profileRow = 0; // 0: Profiles row, 1: Logout row

async function validateAndCleanProfiles() {
    if (allProfiles.length === 0) return;
    let validProfiles = [];
    let changed = false;

    for (const p of allProfiles) {
        try {
            const res = await fetch('https://id.twitch.tv/oauth2/validate', {
                headers: { 'Authorization': 'OAuth ' + p.token }
            });
            if (res.status === 401) {
                if (!p.refresh) { changed = true; continue; }
                const refreshRes = await fetch('https://id.twitch.tv/oauth2/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `client_id=${CLIENT_ID}&grant_type=refresh_token&refresh_token=${p.refresh}`
                });
                const data = await refreshRes.json();
                if (data.access_token) {
                    p.token = data.access_token;
                    p.refresh = data.refresh_token || p.refresh;
                    validProfiles.push(p);
                    changed = true;
                } else {
                    changed = true; // Refresh failed, remove
                }
            } else if (res.ok) {
                validProfiles.push(p);
            } else {
                validProfiles.push(p); // 500 error etc, keep it
            }
        } catch (e) {
            validProfiles.push(p); // Network error, keep it
        }
    }

    if (changed) {
        allProfiles = validProfiles;
        localStorage.setItem('twitch_profiles', JSON.stringify(allProfiles));
        
        // Se il profilo attivo è stato rimosso, cambialo
        if (!allProfiles.find(p => p.id === activeProfileId)) {
            if (allProfiles.length > 0) {
                activeProfileId = allProfiles[0].id;
                localStorage.setItem('active_profile_id', activeProfileId);
            } else {
                activeProfileId = '';
                userToken = '';
                refreshToken = '';
                userId = '';
                localStorage.removeItem('active_profile_id');
                localStorage.removeItem('twitch_access_token');
                localStorage.removeItem('twitch_refresh_token');
                localStorage.removeItem('twitch_user_id');
            }
            loadActiveProfile();
        }
        
        // Evita che il cursore finisca fuori dai limiti se un account sparisce
        if (profileActiveCol >= allProfiles.length) {
            profileActiveCol = allProfiles.length > 0 ? allProfiles.length - 1 : 0;
            if (profileActiveCol < 0) profileActiveCol = 0;
        }
    }
}

async function showProfileScreen() {
    const viewArea = document.getElementById('main-view-area');
    if (!viewArea) return;
    const textColor = document.body.classList.contains('theme-light') ? '#000' : 'white';

    if (allProfiles.length === 0) {
        await startDeviceFlow();
        return;
    }

    let html = `
        <div class="full-page-screen" style="display:flex; flex-direction:column; align-items:center; justify-content:center;">
            <h1 style="color:${textColor}; font-size:52px; margin-bottom: 60px; font-weight:bold;">Accounts</h1>
            <div class="profiles-grid" style="display:flex; justify-content:center; align-items:center; gap:60px; flex-wrap:wrap; margin-bottom: 60px;">`;

    allProfiles.forEach((p, index) => {
        const isSelected = !inMenu && profileRow === 0 && profileActiveCol === index;
        const isActive = p.id === activeProfileId;
        html += `
            <div class="profile-item ${isSelected ? 'focused' : ''}" id="profile-card-${index}" onclick="switchProfile(${index})" style="text-align:center; width:200px; transition: transform 0.3s ease; cursor:pointer;">
                <div class="profile-avatar-wrapper" style="position:relative; width:170px; height:170px; margin: 0 auto 20px;">
                    <img src="${p.img}" style="width:100%; height:100%; border-radius:50%; border: 6px solid ${isSelected ? '#bf94ff' : (isActive ? 'rgba(191,148,255,0.4)' : 'transparent')}; box-shadow: ${isSelected ? '0 0 30px #bf94ff' : 'none'}; transition: all 0.3s ease;">
                    ${isActive ? '<div style="position:absolute; bottom:10px; right:10px; background:#bf94ff; color:white; border-radius:50%; width:35px; height:35px; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:bold; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">✓</div>' : ''}
                </div>
                <div style="color:${textColor}; font-size:24px; font-weight:bold; opacity: ${isSelected ? '1' : '0.8'};">${p.name}</div>
            </div>`;
    });

    const isAddSelected = !inMenu && profileRow === 0 && profileActiveCol === allProfiles.length;
    html += `
        <div class="profile-item add-profile ${isAddSelected ? 'focused' : ''}" id="profile-card-add" style="text-align:center; width:200px; transition: transform 0.3s ease;">
            <div style="width:170px; height:170px; border-radius:50%; background: ${isAddSelected ? 'rgba(191, 148, 255, 0.2)' : 'rgba(191, 148, 255, 0.05)'}; border: 5px dashed #bf94ff; margin: 0 auto 20px; display:flex; align-items:center; justify-content:center; font-size:70px; color:#bf94ff; box-shadow: ${isAddSelected ? '0 0 30px #bf94ff' : 'none'}; transition: all 0.3s ease;">+</div>
            <div style="color:${textColor}; font-size:24px; font-weight:bold; opacity: ${isAddSelected ? '1' : '0.8'};">Add Account</div>
        </div>
    </div>`;

    viewArea.innerHTML = html;
}

let pollIntervalTimer = null;
let inDeviceFlow = false;

async function startDeviceFlow() {
    inDeviceFlow = true;
    const viewArea = document.getElementById('main-view-area');
    if (!viewArea) return false;
    
    try {
        const resp = await fetch('https://id.twitch.tv/oauth2/device', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `client_id=${CLIENT_ID}&scopes=user:read:follows`
        });
        const data = await resp.json();
        const textColor = document.body.classList.contains('theme-light') ? '#000' : 'white';
        const qrUrl = data.verification_uri || `https://www.twitch.tv/activate?device-code=${data.user_code}`;
        
        viewArea.innerHTML = `
            <div class="full-page-screen" style="position:relative; width: 100%;">
                <div style="position:absolute; left: 0; top: 50%; width: calc(50% - 250px); transform: translateY(-50%); display:flex; justify-content:center; align-items:center;">
                    <div style="background: white; padding: 20px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}" style="width:300px; height:300px; display:block; object-fit:contain;">
                    </div>
                </div>
                <div class="activation-box" style="position:absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); text-align:center; padding: 25px 40px; min-width: auto;">
                    <h1 style="color:#bf94ff; font-size:38px; margin-bottom: 10px; font-weight:bold;">twitch.tv/activate</h1>
                    <div style="color:${textColor}; font-size:70px; font-weight:bold; margin:20px 0; letter-spacing:12px;">${data.user_code}</div>
                    ${allProfiles.length > 0 ? `<div style="color:#adadb8; font-size:18px; margin-top:15px; font-weight:normal;">Press BACK to cancel</div>` : ''}
                </div>
            </div>`;
            
        pollForToken(data.device_code, data.interval);
        return true;
    } catch (e) {
        console.error("Device Flow Error:", e);
        viewArea.innerHTML = `<div style="color:red; text-align:center; padding-top:100px;">Connection error. Please check your internet.</div>`;
        return false;
    }
}

async function switchProfile(index) {
    const profile = allProfiles[index];
    if (profile) {
        isProfileSelectionOnStartup = false;
        activeProfileId = profile.id;
        localStorage.setItem('active_profile_id', activeProfileId);
        loadActiveProfile();
        
        // Fix: Reset notification state when switching profile
        isFirstCheck = true;
        lastLiveStreamIds = new Set();

        const splash = document.getElementById('splash-screen');
        if (splash) splash.classList.remove('hidden');
        
        // Ricarica tutto
        await checkLoginStatus();

        const viewArea = document.getElementById('main-view-area');

        if (!userToken) {
            // Se il token era scaduto e il refresh è fallito, logout() ha già rimosso l'account e ricaricato la UI.
            if (splash) splash.classList.add('hidden');
            if (viewArea) {
                const errorDiv = document.createElement('div');
                errorDiv.style.color = '#ff4f4f';
                errorDiv.style.fontSize = '24px';
                errorDiv.style.fontWeight = 'bold';
                errorDiv.style.textAlign = 'center';
                errorDiv.style.position = 'absolute';
                errorDiv.style.top = '40px';
                errorDiv.style.width = '100%';
                errorDiv.style.zIndex = '10';
                errorDiv.innerText = 'Session expired. The account has been automatically removed.';
                viewArea.appendChild(errorDiv);
                
                setTimeout(() => {
                    if (errorDiv.parentNode) errorDiv.parentNode.removeChild(errorDiv);
                }, 5000);
            }
            return;
        }

        currentFocusIndex = 1; // go to home
        inMenu = true;
        
        await loadContent();
        updateNav();

        if (splash) {
            // Add a tiny delay to ensure rendering is complete before hiding splash
            setTimeout(() => {
                splash.classList.add('hidden');
            }, 100);
        }
    }
}

async function removeActiveProfile() {
    allProfiles = allProfiles.filter(p => p.id !== activeProfileId);
    localStorage.setItem('twitch_profiles', JSON.stringify(allProfiles));
    
    if (allProfiles.length > 0) {
        activeProfileId = allProfiles[0].id;
        localStorage.setItem('active_profile_id', activeProfileId);
        loadActiveProfile();
    } else {
        activeProfileId = '';
        userToken = '';
        refreshToken = '';
        userId = '';
    }
    
    // Reset notifications on removal too
    isFirstCheck = true;
    lastLiveStreamIds = new Set();
 
    if (allProfiles.length === 0) {
        currentFocusIndex = 4;
        inMenu = false;
    }

    await loadContent();
    updateNav();
}

async function pollForToken(deviceCode, interval) {
    if (pollIntervalTimer) clearInterval(pollIntervalTimer);
    pollIntervalTimer = setInterval(async () => {
        const check = await fetch('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `client_id=${CLIENT_ID}&device_code=${deviceCode}&grant_type=urn:ietf:params:oauth:grant-type:device_code`
        });
        const res = await check.json();
        if (res.access_token) {
            clearInterval(pollIntervalTimer);
            pollIntervalTimer = null;
            inDeviceFlow = false;
            
            // Temporary set token to fetch user info
            userToken = res.access_token;
            
            // Fetch User Info to store in the profile list
            const userRes = await twitchFetch('https://api.twitch.tv/helix/users');
            const user = userRes.data && userRes.data[0];
            
            if (user) {
                isProfileSelectionOnStartup = false;
                const newProfile = {
                    id: user.id,
                    name: user.display_name,
                    img: user.profile_image_url,
                    token: res.access_token,
                    refresh: res.refresh_token || ''
                };
                
                // Remove existing if same ID
                allProfiles = allProfiles.filter(p => p.id !== user.id);
                allProfiles.push(newProfile);
                localStorage.setItem('twitch_profiles', JSON.stringify(allProfiles));
                activeProfileId = user.id;
                localStorage.setItem('active_profile_id', activeProfileId);
                loadActiveProfile();
            }

            // Fix notifications when adding a new account
            isFirstCheck = true;
            lastLiveStreamIds = new Set();

            const splash = document.getElementById('splash-screen');
            if (splash) splash.classList.remove('hidden');

            await getFollowData();
            currentFocusIndex = 1;
            inMenu = true;
            updateNav();
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
    // Set to 40px as requested, with 60px outer padding.
    let html = `<div style="display:flex; flex-direction:column; min-height:calc(100vh - 340px); padding-bottom:40px;">`;
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
                let thumb = getSafeThumb(item.thumbnail_url, 'stream');
                const viewers = formatViewers(item.viewer_count);
                html += `
                    <div id="search-card-${rIdx}-${cIdx}" class="channel-card follow-card ${selClass}" style="flex-shrink:0;">
                        <div class="badge-live">LIVE</div>
                        <div class="badge-viewers">${viewers}</div>
                        <img src="${thumb}" loading="lazy" onerror="this.src='icon.png'" style="width:100%; height:100%; object-fit:cover;">
                        <div class="card-info">
                            <div style="font-size:22px; font-weight:bold; color:white;">${item.user_name}</div>
                            <div style="font-size:16px; color:#adadb8; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.title}</div>
                        </div>
                    </div>`;
            } else if (row.type === 'category') {
                const box = item.box_art_url || '';
                let highResBox = getSafeThumb(box, 'category');
                html += `
                    <div class="category-card ${selClass}" id="search-card-${rIdx}-${cIdx}" style="flex-shrink:0; width:200px; height:266px;">
                        <img src="${highResBox}" loading="lazy" onerror="this.src='icon.png'" style="width:100%; height:100%; border-radius:10px; object-fit:cover;">
                        <div style="margin-top:10px; font-weight:bold; color:${titleColor}; text-align:center;">${item.name}</div>
                    </div>`;
            } else if (row.type === 'channel') {
                const thumb = item.thumbnail_url || '';
                const highResThumb = thumb.replace(/-[0-9]+x[0-9]+\./, '-300x300.').replace('{width}', '300').replace('{height}', '300');
                html += `
                    <div class="search-channel-card ${selClass}" id="search-card-${rIdx}-${cIdx}" style="flex-shrink:0; width:350px;">
                        <img src="${highResThumb}" loading="lazy" onerror="this.src='icon.png'" class="search-avatar">
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
        viewArea.scrollTop = 0;
        window.scrollTo({ top: 0, behavior: 'instant' });
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
            let thumb = getSafeThumb(item.thumbnail_url, 'stream');
            html += `
                <div class="channel-card" id="channel-card-0-${idx}">
                    ${item.isLiveItem ? '<div class="badge-live">LIVE</div>' : '<div class="badge-viewers no-dot">' + item.duration + '</div>'}
                    ${item.isLiveItem ? '<div class="badge-viewers">' + formatViewers(item.viewer_count) + '</div>' : ''}
                    <img src="${thumb}" loading="lazy" onerror="this.src='icon.png'" style="width:100%; height:100%; object-fit:cover;">
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
                let thumb = getSafeThumb(item.thumbnail_url, 'stream');
                html += `
                    <div class="channel-card" id="channel-card-2-${idx}">
                        <div class="badge-viewers no-dot">${formatViewers(item.view_count)} views</div>
                        <img src="${thumb}" loading="lazy" onerror="this.src='icon.png'" style="width:100%; height:100%; object-fit:cover;">
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
    window.scrollTo({ top: 0, behavior: 'instant' });
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
        viewArea.scrollTop = 0;
        window.scrollTo({ top: 0, behavior: 'instant' });
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

        // Fetch viewer count if missing or to refresh it
        try {
            const viewerRes = await twitchFetch(`https://api.twitch.tv/helix/streams?game_id=${category.id}&first=100`);
            if (viewerRes && viewerRes.data) {
                category.viewer_count = viewerRes.data.reduce((sum, s) => sum + s.viewer_count, 0);
            }
        } catch (e) { console.error("Error fetching viewer count", e); }

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
                    <div style="color:#bf94ff; font-size:22px; font-weight:600;">${viewers} spettatori</div>
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
                let thumb = getSafeThumb(item.thumbnail_url, 'stream');
                card.innerHTML = `
                    <div class="badge-live">LIVE</div>
                    <div class="badge-viewers">${formatViewers(item.viewer_count)}</div>
                    <img src="${thumb}" loading="lazy" onerror="this.src='icon.png'" style="width:100%; height:100%; object-fit:cover;">
                    <div class="card-info">
                        <div style="font-size:22px; font-weight:bold; color:white;">${item.user_name}</div>
                        <div style="font-size:16px; color:#adadb8; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.title}</div>
                    </div>`;
            } else if (row.type === 'clip') {
                let thumb = getSafeThumb(item.thumbnail_url, 'stream');
                card.innerHTML = `
                    <div class="badge-viewers no-dot">${formatViewers(item.view_count)} views</div>
                    <img src="${thumb}" loading="lazy" onerror="this.src='icon.png'" style="width:100%; height:100%; object-fit:cover;">
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
    window.scrollTo({ top: 0, behavior: 'instant' });
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
        if (inDeviceFlow && allProfiles.length > 0) {
            if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
                e.preventDefault();
                inDeviceFlow = false;
                if (pollIntervalTimer) {
                    clearInterval(pollIntervalTimer);
                    pollIntervalTimer = null;
                }
                showProfileScreen();
                return;
            }
        }
        
        if (currentFocusIndex === 4) {
            // In Profile View: allow navigation, but bind back keys to exit
            if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
                showExitMenu();
                return;
            }
            // Allow other keys to fall through to profile grid navigation
        } else {
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
    }

    // GESTIONE ANNULLAMENTO DEVICE FLOW (QUANDO GIÀ LOGGATI)
    if (inDeviceFlow && allProfiles.length > 0) {
        if (e.keyCode === 8 || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
            e.preventDefault();
            inDeviceFlow = false;
            if (pollIntervalTimer) {
                clearInterval(pollIntervalTimer);
                pollIntervalTimer = null;
            }
            showProfileScreen();
            return;
        }
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
                        setTimeout(() => {
                            try {
                                webapis.avplay.jumpForward(0); // Jump to current live point
                            } catch(e) {}
                        }, 500);

                        isPlaying = true;
                        document.getElementById('icon-pause').style.display = 'block';
                        document.getElementById('icon-play').style.display = 'none';
                    }
                } catch (e) { console.error('AVPlay play/pause error', e); }
            } else if (playerFocusIndex === 1) { // Menu Qualità
                const menu = document.getElementById('quality-menu');
                menu.innerHTML = qualityOptions.map((q, i) => `<div class="quality-item ${i === 0 ? 'focused' : ''}">${q.name}</div>`).join('');
                menu.style.display = 'flex'; isQualityMenuOpen = true; qualityFocusIndex = 0;
            } else if (playerFocusIndex === 2) { // Vai al Canale
                const channelToOpen = currentStreamChannel;
                closeNativePlayer();
                openChannelView(channelToOpen);
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
                        openNativePlayer(item.user_name || item.user_login, item.user_id, item.title);
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
                    openNativePlayer(item.user_name || item.user_login, item.user_id, item.title);
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
                    openNativePlayer(selectedStream.user_name || selectedStream.user_login, selectedStream.user_id, selectedStream.title);
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
                    // Click su Card Live in Follow -> Apri direttamente il Player
                    openNativePlayer(selectedStream.user_name || selectedStream.user_login, selectedStream.user_id, selectedStream.title);
                } else if (currentRowData.type === 'avatars') {
                    const selectedAvatar = currentRowData.data[followActiveCol];
                    // Click su Avatar -> Vai al Canale
                    openChannelView(selectedAvatar.login);
                }
            }
        } else if (selectedId === 'menu-settings') {
            if (settingsRow === -1) {
                // Focus is on Tabs
                if (e.keyCode === 39 && settingsTab === 0) { settingsTab = 1; showSettingsScreen(); }
                else if (e.keyCode === 37 && settingsTab === 1) { settingsTab = 0; showSettingsScreen(); }
                else if (e.keyCode === 40) { settingsRow = 0; showSettingsScreen(); }
                else if (e.keyCode === 38) { inMenu = true; updateNav(); showSettingsScreen(); }
            } else {
                // Focus is on Settings items
                let maxRow = settingsTab === 0 ? 2 : 2;

                if (e.keyCode === 40 && settingsRow < maxRow) { settingsRow++; showSettingsScreen(); }
                else if (e.keyCode === 38) { 
                    if (settingsRow > 0) { settingsRow--; showSettingsScreen(); } 
                    else { settingsRow = -1; showSettingsScreen(); } 
                }
                else if (e.keyCode === 13 || e.keyCode === 37 || e.keyCode === 39) {
                    // Toggle value on Enter or Left/Right
                    if (settingsTab === 0) {
                        if (settingsRow === 0) appSettings.barPos = appSettings.barPos === 'center' ? 'left' : 'center';
                        else if (settingsRow === 1) appSettings.theme = appSettings.theme === 'dark' ? 'light' : 'dark';
                        else if (settingsRow === 2) appSettings.notifications = !appSettings.notifications;
                    } else {
                        if (settingsRow === 0) appSettings.performanceMode = !appSettings.performanceMode;
                        else if (settingsRow === 1) appSettings.adBlock = !appSettings.adBlock;
                        else if (settingsRow === 2) {
                            if (e.keyCode === 13) removeActiveProfile();
                            return;
                        }
                    }
                    saveSettings(); showSettingsScreen(); setTimeout(updateNav, 50);
                }
            }
        } else if (selectedId === 'menu-profile') {
            if (allProfiles.length === 0) {
                if (e.keyCode === 38) { inMenu = true; updateNav(); showProfileScreen(); }
                return;
            }

            if (profileRow === 0) { // Riga Profili + Add
                if (e.keyCode === 39) { // Destra
                    if (profileActiveCol < allProfiles.length) { profileActiveCol++; showProfileScreen(); }
                } else if (e.keyCode === 37) { // Sinistra
                    if (profileActiveCol > 0) { profileActiveCol--; showProfileScreen(); }
                } else if (e.keyCode === 38) { // Su -> Menu
                    if (userToken) {
                        inMenu = true; updateNav(); showProfileScreen();
                    }
                } else if (e.keyCode === 13) { // OK
                    if (profileActiveCol < allProfiles.length) {
                        switchProfile(profileActiveCol);
                    } else {
                        // Tasto Add Profile (+)
                        startDeviceFlow();
                    }
                }
            }
        }
    }
}

// --- MOTORE NATIVE PLAYER (GraphQL + HLS) ---
async function getStreamM3u8(channel) {
    try {
        // 1. Usa il client-id pubblico Web di Twitch per bypassare blocchi OAuth sullo streaming
        const gqlBody = {
            operationName: 'PlaybackAccessToken_Template',
            query: `query PlaybackAccessToken_Template($login: String!, $playerType: String!) {  streamPlaybackAccessToken(channelName: $login, params: {platform: "web", playerBackend: "mediaplayer", playerType: $playerType}) { value signature } }`,
            variables: { login: channel, playerType: 'site' }
        };

        let headers = { 'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko', 'Content-Type': 'application/json' };
        // Se Tizen richiede di essere autenticati per non essere bloccati (opzionale)
        // if (userToken) headers['Authorization'] = 'OAuth ' + userToken;

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
        if (appSettings.adBlock) {
            try {
                // Utilizziamo un proxy più stabile (PerfProd Load Balancer)
                // Se questo fallisce (es. errore 525 o timeout), il catch ci riporta all'URL originale di Twitch.
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
        const streams = [{ name: 'Auto', url: m3u8Url }]; // La prima è sempre l'Auto nativa
        let currentName = null;
        let mediaMap = {};

        // Extract human-readable names from MEDIA tags
        lines.forEach(line => {
            if (line.startsWith('#EXT-X-MEDIA:TYPE=VIDEO')) {
                const groupIdMatch = line.match(/GROUP-ID="([^"]+)"/);
                const nameMatch = line.match(/NAME="([^"]+)"/);
                if (groupIdMatch && nameMatch) {
                    // Rimuovi "(source)" dai nomi per un menu più pulito
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

        // Ordinamento Qualità (Tattica: Dalla più alta alla più bassa)
        // Manteniamo 'Auto' in cima, poi ordiniamo il resto
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
}

async function openNativePlayer(channelName, channelId, streamTitle) {
    inPlayer = true;
    playerFocusIndex = 0; // Reset focus to Play button

    // Tecniche Ottimizzazione Memoria: "Mondo Vuoto"
    const appContainer = document.getElementById('app-container');
    if (appContainer) appContainer.style.display = 'none';

    currentStreamChannel = channelName;
    currentStreamId = channelId;
    currentStreamTitle = streamTitle || "";

    // Aggiorna Titolo UI
    const titleEl = document.getElementById('player-live-title');
    if (titleEl) titleEl.innerText = currentStreamTitle;
    
    // Create AVPlayer dynamically as requested
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

    qualityOptions = await getStreamM3u8(channelName);
    
    if (qualityOptions && qualityOptions.error) {
        alert("Fetch Error: " + qualityOptions.error);
        closeNativePlayer(); return;
    }
    
    if (!qualityOptions || qualityOptions.length === 0) {
        alert("Error: Unable to fetch video stream for " + channelName);
        closeNativePlayer(); return;
    }

    try {
        // Avvia con la risoluzione nativa fissa più alta (index 1) se disponibile, altrimenti Auto.
        // Questo evita gli sbalzi di bitrate dell'HLS su Tizen che causano stuttering e loop audio.
        const defaultQualityUrl = qualityOptions.length > 1 ? qualityOptions[1].url : qualityOptions[0].url;
        playVideoUrl(defaultQualityUrl);
    } catch (err) {
        alert("Error starting video: " + err.message);
        closeNativePlayer();
    }
    // Rimossa l'assegnazione automatica del src della chat qui per salvare RAM.

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

        // Ottimizzazione Buffer (Tattica da SmartTwitchTV): 
        // Imposta un buffer di 5 secondi per stabilizzare la riproduzione e ridurre il carico CPU/RAM dovuto a continui re-buffering su connessioni instabili.
        try {
            webapis.avplay.setBufferingParam('PLAYER_BUFFER_FOR_PLAY', 'PLAYER_BUFFER_SIZE_IN_SECOND', 5);
            webapis.avplay.setBufferingParam('PLAYER_BUFFER_FOR_RESUME', 'PLAYER_BUFFER_SIZE_IN_SECOND', 5);
        } catch (bufErr) {
            console.warn("Impossibile impostare i parametri di buffering:", bufErr);
        }

        var listener = {
            onbufferingstart: function() { console.log("Buffering start."); },
            onbufferingprogress: function(percent) { console.log("Buffering progress data : " + percent); },
            onbufferingcomplete: function() { console.log("Buffering complete."); },
            onstreamcompleted: function() {
                console.log("Stream Completed");
                webapis.avplay.stop();
            },
            oncurrentplaytime: function(currentTime) { },
            onerror: function(eventType) { console.log("event type error : " + eventType); },
            ondrmevent: function(drmEvent, drmData) { console.log("DRM callback: " + drmEvent + ", data: " + drmData); },
            onsubtitlechange: function(duration, text, data3, data4) { }
        };

        webapis.avplay.setListener(listener);
        webapis.avplay.setDisplayMethod('PLAYER_DISPLAY_MODE_FULL_SCREEN');

        webapis.avplay.prepareAsync(function () {
            webapis.avplay.setDisplayRect(0, 0, 1920, 1080);
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

    // Ripristina la UI (Mondo Vuoto)
    const appContainer = document.getElementById('app-container');
    if (appContainer) appContainer.style.display = 'block';

    // Chiusura aggressiva vitale per Smart TV AVPlay
    try {
        webapis.avplay.stop();
        webapis.avplay.close();
    } catch (e) { console.error('AVPlay close error', e); }

    document.body.classList.remove('player-active');
    document.documentElement.classList.remove('player-active');
    document.getElementById('player-container').style.display = 'none';
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