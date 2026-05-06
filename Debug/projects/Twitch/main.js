const CLIENT_ID = '9g8h4ha9stbc9r76624evvlx4bzk39';
let userToken = localStorage.getItem('twitch_access_token') || '';
let refreshToken = localStorage.getItem('twitch_refresh_token') || '';
let userId = localStorage.getItem('twitch_user_id') || '';

// Default language is English ('en')
let appSettings = JSON.parse(localStorage.getItem('twitch_settings')) || { barPos: 'left', theme: 'dark', language: 'en' };

// --- i18n strings ---
const STRINGS = {
    en: {
        loading: 'Loading...',
        errorLoad: 'Loading error. Please try again later.',
        followedChannels: 'Channels you follow',
        loginPrompt: 'Log in to see channels you follow',
        loginBtn: 'Go to Profile to Log In',
        categories: 'Categories',
        settings: 'Settings',
        barPosition: 'Bar Position',
        barLeft: 'Top Left',
        barCenter: 'Top Center',
        themeLabel: 'Theme',
        themeDark: 'Dark',
        themeLight: 'Light',
        languageLabel: 'Language',
        hello: 'Hello',
        logout: 'LOG OUT',
        activateUrl: 'twitch.tv/activate'
    },
    it: {
        loading: 'Caricamento...',
        errorLoad: 'Errore caricamento. Riprova più tardi.',
        followedChannels: 'Canali che segui',
        loginPrompt: 'Accedi per vedere i canali che segui',
        loginBtn: 'Vai al Profilo per Accedere',
        categories: 'Categorie',
        settings: 'Impostazioni',
        barPosition: 'Posizione Barra',
        barLeft: 'In alto a sinistra',
        barCenter: 'In alto al centro',
        themeLabel: 'Tema',
        themeDark: 'Scuro',
        themeLight: 'Chiaro',
        languageLabel: 'Lingua / Language',
        hello: 'Ciao',
        logout: 'ESCI / LOGOUT',
        activateUrl: 'twitch.tv/activate'
    }
};

function t(key) {
    const lang = appSettings.language || 'en';
    return (STRINGS[lang] && STRINGS[lang][key]) || STRINGS['en'][key] || key;
}

let currentFocusIndex = 1; // 0: Search, 1: Home, 2: Settings, 3: Profile
let inMenu = true;
let homeDataRows = [];
let activeRow = 0;
let colIndices = [];
// For settings screen
let settingsRow = 0;
let settingsCol = [0, 0, 0];

window.onload = async function () {
    applySettings();
    if (userToken && !userId) {
        await fetchUserId();
    }
    updateNav();
    loadContent();
    document.addEventListener('keydown', handleKeydown);
};

function applySettings() {
    const topbar = document.getElementById('main-menu');
    if (appSettings.barPos === 'center') {
        topbar.style.justifyContent = 'center';
    } else {
        topbar.style.justifyContent = 'flex-start';
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
            options.headers['Authorization'] = 'Bearer ' + userToken;
            res = await fetch(url, options);
        } else {
            userToken = '';
            refreshToken = '';
            localStorage.removeItem('twitch_access_token');
            localStorage.removeItem('twitch_refresh_token');
        }
    }
    return res.json();
}

// --- Viewer count formatting ---
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

    if (viewArea) viewArea.innerHTML = `<div style="text-align:center; padding-top:100px; color:white;">${t('loading')}</div>`;

    if (selectedId === 'menu-home') {
        activeRow = 0;
        await getTwitchHome();
    } else if (selectedId === 'menu-settings') {
        settingsRow = 0;
        settingsCol = [
            appSettings.barPos === 'left' ? 0 : 1,
            appSettings.theme === 'dark' ? 0 : 1,
            appSettings.language === 'en' ? 0 : 1
        ];
        showSettingsScreen();
    } else if (selectedId === 'menu-profile') {
        showProfileScreen();
    }
}

async function getTwitchHome() {
    homeDataRows = [];

    try {
        // 1. Recommended (Hero) — the big centered carousel
        const recRes = await twitchFetch('https://api.twitch.tv/helix/streams?first=10');
        if (recRes.data && recRes.data.length > 0) {
            homeDataRows.push({ title: "", type: "stream", data: recRes.data, isHero: true });
        }

        // 2. Followed (if logged in) or Login Button
        if (userId && userToken) {
            const folRes = await twitchFetch(`https://api.twitch.tv/helix/streams/followed?user_id=${userId}&first=10`);
            if (folRes.data && folRes.data.length > 0) {
                homeDataRows.push({ title: t('followedChannels'), type: "stream", data: folRes.data });
            } else {
                // Followed but no one live
                homeDataRows.push({ title: t('followedChannels'), type: "stream", data: [] });
            }
        } else {
            homeDataRows.push({ title: t('loginPrompt'), type: "login_btn", data: [{}] });
        }

        // 3. Top Categories
        const catRes = await twitchFetch('https://api.twitch.tv/helix/games/top?first=10');
        if (catRes.data && catRes.data.length > 0) {
            homeDataRows.push({ title: t('categories'), type: "category", data: catRes.data });

            // 4. Streams for top 4 categories, sorted by viewer_count descending
            const top4 = catRes.data.slice(0, 4);
            for (const cat of top4) {
                const catStreams = await twitchFetch(`https://api.twitch.tv/helix/streams?game_id=${cat.id}&first=10`);
                if (catStreams.data && catStreams.data.length > 0) {
                    // Sort descending by viewer_count
                    catStreams.data.sort((a, b) => b.viewer_count - a.viewer_count);
                    homeDataRows.push({ title: cat.name, type: "stream", data: catStreams.data });
                }
            }
        }

        colIndices = new Array(homeDataRows.length).fill(0);
        renderHome();
    } catch (e) {
        console.error("Errore API", e);
        const va = document.getElementById('main-view-area');
        if (va) va.innerHTML = `<div style="color:red; text-align:center; padding-top:100px;">${t('errorLoad')}</div>`;
    }
}

function renderHome() {
    const viewArea = document.getElementById('main-view-area');
    if (!viewArea) return;

    const isLight = document.body.classList.contains('theme-light');
    const titleColor = isLight ? '#000' : 'white';

    let html = '<div id="home-view" style="padding-top:20px; padding-bottom:100px;">';

    homeDataRows.forEach((row, rowIndex) => {
        if (row.title) {
            html += `<h3 style="color:${titleColor}; margin-left:80px; margin-bottom:15px; font-size:26px;">${row.title}</h3>`;
        }
        const extraTop = (!row.title && rowIndex === 0) ? 'margin-top: 30px;' : '';
        const gridClass = row.isHero ? 'channel-grid hero-grid' : 'channel-grid';
        html += `
            <div style="width:100%; overflow:visible; perspective:1000px; margin-bottom:40px; ${extraTop}">
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
            // Centered login button
            rowDiv.style.justifyContent = 'center';
            const card = document.createElement('div');
            card.className = 'login-home-btn';
            card.innerHTML = t('loginBtn');
            rowDiv.appendChild(card);
        } else if (row.type === 'category') {
            row.data.forEach((item) => {
                const card = document.createElement('div');
                card.className = 'category-card';
                let thumb = item.box_art_url.replace('{width}', '200').replace('{height}', '267');
                card.innerHTML = `
                    <img src="${thumb}" style="width:100%; height:100%; object-fit:cover;">
                    <div class="card-info" style="background: linear-gradient(transparent, rgba(0,0,0,0.9)); padding:15px;">
                        <div style="font-size:18px; font-weight:bold; color:white;">${item.name}</div>
                    </div>`;
                rowDiv.appendChild(card);
            });
        } else if (row.type === 'stream') {
            row.data.forEach((item) => {
                const card = document.createElement('div');
                card.className = row.isHero ? 'channel-card hero-card' : 'channel-card';
                let thumb = item.thumbnail_url.replace('{width}', '640').replace('{height}', '360');
                const viewers = formatViewers(item.viewer_count);
                card.innerHTML = `
                    <div class="badge-live">LIVE</div>
                    <div class="badge-viewers">${viewers}</div>
                    <img src="${thumb}" style="width:100%; height:100%; object-fit:cover;">
                    <div class="card-info">
                        <div style="font-size:${row.isHero ? '24' : '18'}px; font-weight:bold; color:white;">${item.user_name}</div>
                        <div style="font-size:${row.isHero ? '16' : '14'}px; color:#adadb8; margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.title}</div>
                    </div>`;
                rowDiv.appendChild(card);
            });
        }
    });

    updateHomeSelection();
}

function updateHomeSelection() {
    const centerX = window.innerWidth / 2;
    const gap = 15;

    homeDataRows.forEach((row, rowIndex) => {
        const rowDiv = document.getElementById(`row-${rowIndex}`);
        if (!rowDiv) return;

        const currentColIdx = colIndices[rowIndex];
        const isActiveRow = !inMenu && activeRow === rowIndex;

        if (row.type === 'login_btn') {
            const btn = rowDiv.querySelector('.login-home-btn');
            if (btn) {
                btn.classList.toggle('focused', isActiveRow);
            }
            return;
        }

        const selector = row.type === 'category' ? '.category-card' : '.channel-card';
        const cards = rowDiv.querySelectorAll(selector);

        cards.forEach((c, i) => {
            c.classList.remove('selected', 'hero-adjacent');

            if (row.isHero) {
                // Apply arc/carousel effect for hero
                if (isActiveRow && i === currentColIdx) {
                    c.classList.add('selected');
                } else if (isActiveRow && (i === currentColIdx - 1 || i === currentColIdx + 1)) {
                    c.classList.add('hero-adjacent');
                }
            } else {
                c.classList.toggle('selected', isActiveRow && i === currentColIdx);
            }
        });

        if (cards.length > 0) {
            let cardWidth, offset;

            if (row.isHero) {
                cardWidth = 640 + gap;
                // Centered
                offset = centerX - 320 - (currentColIdx * cardWidth);
            } else if (row.type === 'stream') {
                cardWidth = 440 + gap;
                // Left aligned: start at 80px margin
                offset = 80 - (currentColIdx * cardWidth);
            } else if (row.type === 'category') {
                cardWidth = 200 + gap;
                offset = 80 - (currentColIdx * cardWidth);
            }

            rowDiv.style.transform = `translateX(${offset}px)`;
        }
    });

    // Vertical scroll alignment
    if (!inMenu && activeRow > 0) {
        const rowEl = document.getElementById(`row-${activeRow}`);
        if (rowEl) {
            // Calcoliamo la posizione assoluta della riga rispetto al documento
            const rect = rowEl.getBoundingClientRect();
            const absoluteTop = rect.top + window.pageYOffset;
            // Centriamo la riga nello schermo
            const targetY = absoluteTop - (window.innerHeight / 2) + (rect.height / 2);
            window.scrollTo({ top: targetY, behavior: 'auto' });
        }
    } else {
        window.scrollTo({ top: 0, behavior: 'auto' });
    }
}

function showSettingsScreen() {
    const viewArea = document.getElementById('main-view-area');
    if (!viewArea) return;

    const textColor = document.body.classList.contains('theme-light') ? '#000' : 'white';

    viewArea.innerHTML = `
        <div style="text-align:center; padding-top:100px; padding-bottom:100px;">
            <h1 style="color:${textColor}; font-size:48px; transition: color 0.3s;">${t('settings')}</h1>

            <div style="margin-top:60px;">
                <h3 style="color:${textColor}; margin-bottom:20px; transition: color 0.3s;">${t('barPosition')}</h3>
                <div style="display:flex; justify-content:center; gap:40px;">
                    <div class="settings-btn ${(!inMenu && settingsRow === 0 && settingsCol[0] === 0) ? 'focused' : ''} ${appSettings.barPos === 'left' ? 'active-setting' : ''}">${t('barLeft')}</div>
                    <div class="settings-btn ${(!inMenu && settingsRow === 0 && settingsCol[0] === 1) ? 'focused' : ''} ${appSettings.barPos === 'center' ? 'active-setting' : ''}">${t('barCenter')}</div>
                </div>
            </div>

            <div style="margin-top:60px;">
                <h3 style="color:${textColor}; margin-bottom:20px; transition: color 0.3s;">${t('themeLabel')}</h3>
                <div style="display:flex; justify-content:center; gap:40px;">
                    <div class="settings-btn ${(!inMenu && settingsRow === 1 && settingsCol[1] === 0) ? 'focused' : ''} ${appSettings.theme === 'dark' ? 'active-setting' : ''}">${t('themeDark')}</div>
                    <div class="settings-btn ${(!inMenu && settingsRow === 1 && settingsCol[1] === 1) ? 'focused' : ''} ${appSettings.theme === 'light' ? 'active-setting' : ''}">${t('themeLight')}</div>
                </div>
            </div>

            <div style="margin-top:60px;">
                <h3 style="color:${textColor}; margin-bottom:20px; transition: color 0.3s;">${t('languageLabel')}</h3>
                <div style="display:flex; justify-content:center; gap:40px;">
                    <div class="settings-btn ${(!inMenu && settingsRow === 2 && settingsCol[2] === 0) ? 'focused' : ''} ${appSettings.language === 'en' ? 'active-setting' : ''}">English</div>
                    <div class="settings-btn ${(!inMenu && settingsRow === 2 && settingsCol[2] === 1) ? 'focused' : ''} ${appSettings.language === 'it' ? 'active-setting' : ''}">Italiano</div>
                </div>
            </div>
        </div>
    `;

    if (!inMenu && settingsRow > 0) {
        window.scrollTo({ top: 200 + (settingsRow * 100), behavior: 'smooth' });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
                    <h1 style="color:${textColor}; font-size:48px; transition: color 0.3s;">${t('hello')}, ${userName}!</h1>
                    <div class="logout-btn ${!inMenu ? 'focused' : ''}" style="display:inline-block; margin-top:40px; padding:20px 60px; background:red; border-radius:50px; font-size:24px; font-weight:bold; color:white;">${t('logout')}</div>
                </div>`;
        } catch (e) {
            console.error(e);
        }
    } else {
        startDeviceFlow();
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
            <div style="text-align:center; min-width:100vw; padding-top:50px;">
                <h1 style="color:#bf94ff; font-size:50px;">${t('activateUrl')}</h1>
                <div style="color:${textColor}; font-size:80px; font-weight:bold; margin:40px 0; letter-spacing:15px; transition: color 0.3s;">${data.user_code}</div>
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
            if (res.refresh_token) localStorage.setItem('twitch_refresh_token', res.refresh_token);
            await fetchUserId();
            // After login, go back to Home
            currentFocusIndex = 1;
            inMenu = true;
            updateNav();
            loadContent();
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
        } else {
            topbar.classList.remove('hidden-topbar');
        }
    }
}

function handleKeydown(e) {
    const menuItems = document.querySelectorAll('.menu-item');
    const selectedId = menuItems[currentFocusIndex].id;

    if (inMenu) {
        if (e.keyCode === 39 && currentFocusIndex < menuItems.length - 1) {
            currentFocusIndex++; updateNav(); loadContent();
        }
        if (e.keyCode === 37 && currentFocusIndex > 0) {
            currentFocusIndex--; updateNav(); loadContent();
        }
        if (e.keyCode === 40) {
            inMenu = false;
            updateNav();
            if (selectedId === 'menu-home') updateHomeSelection();
            if (selectedId === 'menu-settings') showSettingsScreen();
            if (selectedId === 'menu-profile') showProfileScreen();
        }
    } else {
        if (selectedId === 'menu-home') {
            const currentRowData = homeDataRows[activeRow];
            if (!currentRowData) return;
            const currentLen = currentRowData.data.length;

            if (e.keyCode === 39 && colIndices[activeRow] < currentLen - 1) {
                colIndices[activeRow]++;
                updateHomeSelection();
            }
            if (e.keyCode === 37 && colIndices[activeRow] > 0) {
                colIndices[activeRow]--;
                updateHomeSelection();
            }
            if (e.keyCode === 40 && activeRow < homeDataRows.length - 1) {
                activeRow++;
                updateHomeSelection();
            }
            if (e.keyCode === 38) {
                if (activeRow > 0) {
                    activeRow--;
                    updateHomeSelection();
                } else {
                    inMenu = true;
                    updateNav();
                    updateHomeSelection();
                }
            }
            if (e.keyCode === 13 && currentRowData.type === 'login_btn') {
                // Navigate to profile screen to log in
                currentFocusIndex = 3;
                inMenu = true;
                updateNav();
                loadContent();
            }
        } else if (selectedId === 'menu-settings') {
            if (e.keyCode === 39 && settingsCol[settingsRow] < 1) {
                settingsCol[settingsRow]++;
                showSettingsScreen();
            }
            if (e.keyCode === 37 && settingsCol[settingsRow] > 0) {
                settingsCol[settingsRow]--;
                showSettingsScreen();
            }
            if (e.keyCode === 40 && settingsRow < 2) {
                settingsRow++;
                showSettingsScreen();
            }
            if (e.keyCode === 38) {
                if (settingsRow > 0) {
                    settingsRow--;
                    showSettingsScreen();
                } else {
                    inMenu = true;
                    updateNav();
                    showSettingsScreen();
                }
            }
            if (e.keyCode === 13) {
                if (settingsRow === 0) {
                    appSettings.barPos = settingsCol[0] === 0 ? 'left' : 'center';
                } else if (settingsRow === 1) {
                    appSettings.theme = settingsCol[1] === 0 ? 'dark' : 'light';
                } else if (settingsRow === 2) {
                    appSettings.language = settingsCol[2] === 0 ? 'en' : 'it';
                }
                saveSettings();
                // Ricarichiamo il contenuto per applicare la lingua ovunque
                if (selectedId === 'menu-home') {
                    getTwitchHome();
                } else if (selectedId === 'menu-settings') {
                    showSettingsScreen();
                } else {
                    loadContent();
                }
                setTimeout(updateNav, 50);
            }
        } else if (selectedId === 'menu-profile') {
            if (e.keyCode === 38) { inMenu = true; updateNav(); showProfileScreen(); }
            if (e.keyCode === 13 && userToken) {
                localStorage.removeItem('twitch_access_token');
                localStorage.removeItem('twitch_refresh_token');
                localStorage.removeItem('twitch_user_id');
                userToken = '';
                refreshToken = '';
                userId = '';
                inMenu = true;
                updateNav();
                loadContent();
            }
        }
    }
}