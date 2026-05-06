const CLIENT_ID = '9g8h4ha9stbc9r76624evvlx4bzk39';
let userToken = localStorage.getItem('twitch_access_token') || '';

let currentFocusIndex = 1; // 0: Search, 1: Home, 2: Settings, 3: Profile
let streamFocusIndex = 0;
let inMenu = true; 
let streamsData = [];

window.onload = function () {
    updateNav();
    loadContent(); // Carica Home all'avvio
    document.addEventListener('keydown', handleKeydown);
};

async function loadContent() {
    const menuItems = document.querySelectorAll('.menu-item');
    const selectedId = menuItems[currentFocusIndex].id;
    const grid = document.getElementById('channel-grid');
    const pageTitle = document.getElementById('page-title');

    grid.innerHTML = ''; // Pulisce la griglia

    if (selectedId === 'menu-home') {
        pageTitle.innerText = "Featured Content";
        await getTwitchStreams();
    } else if (selectedId === 'menu-settings') {
        pageTitle.innerText = "Settings";
        grid.innerHTML = `<h1 style="color:white; text-align:center; width:100%; margin-top:100px;">SETTINGS</h1>`;
    } else if (selectedId === 'menu-profile') {
        pageTitle.innerText = "Profile";
        showProfileScreen();
    }
}

async function getTwitchStreams() {
    const token = userToken || 'c3cq4ys4jw8er1sz0pf5u15sfjprxx';
    try {
        const response = await fetch('https://api.twitch.tv/helix/streams?language=it&first=10', {
            headers: { 'Client-ID': CLIENT_ID, 'Authorization': 'Bearer ' + token }
        });
        const json = await response.json();
        streamsData = json.data;
        renderCarousel();
    } catch (e) { console.error("Errore API", e); }
}

function renderCarousel() {
    const grid = document.getElementById('channel-grid');
    streamsData.forEach((s, i) => {
        const card = document.createElement('div');
        card.className = `channel-card ${i === streamFocusIndex && !inMenu ? 'selected' : ''}`;
        let thumb = s.thumbnail_url.replace('{width}', '800').replace('{height}', '450');
        card.innerHTML = `
            <div class="badge-live">LIVE</div>
            <img src="${thumb}" style="width:100%; height:100%; object-fit:cover;">
            <div class="card-info">
                <div style="font-size:28px; font-weight:bold; color:white;">${s.user_name}</div>
                <div style="font-size:18px; color:#adadb8; margin-top:5px;">${s.title}</div>
            </div>`;
        grid.appendChild(card);
    });
    updateCarouselPosition();
}

function updateCarouselPosition() {
    const grid = document.getElementById('channel-grid');
    const cards = document.querySelectorAll('.channel-card');
    if (cards.length === 0) return;

    cards.forEach((c, i) => c.classList.toggle('selected', i === streamFocusIndex && !inMenu));

    const cardWidth = 700; // larghezza + gap approssimativo
    const centerX = window.innerWidth / 2 - 320; 
    const offset = centerX - (streamFocusIndex * cardWidth);
    grid.style.transform = `translateX(${offset}px)`;
}

function showProfileScreen() {
    const grid = document.getElementById('channel-grid');
    if (userToken) {
        grid.innerHTML = `
            <div style="text-align:center; min-width:100vw; padding-top:100px;">
                <h1 style="color:white; font-size:48px;">Account Loggato</h1>
                <div id="logout-trigger" class="logout-btn" style="display:inline-block; margin-top:40px; padding:20px 60px; background:red; border-radius:50px; font-size:24px; font-weight:bold; color:white;">ESCI / LOGOUT</div>
            </div>`;
    } else {
        startDeviceFlow();
    }
}

async function startDeviceFlow() {
    const grid = document.getElementById('channel-grid');
    try {
        const resp = await fetch('https://id.twitch.tv/oauth2/device', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `client_id=${CLIENT_ID}&scopes=user:read:follows`
        });
        const data = await resp.json();
        grid.innerHTML = `
            <div style="text-align:center; min-width:100vw; padding-top:50px;">
                <h1 style="color:#bf94ff; font-size:50px;">twitch.tv/activate</h1>
                <div style="font-size:80px; font-weight:bold; color:white; margin:40px 0; letter-spacing:15px;">${data.user_code}</div>
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
            localStorage.setItem('twitch_access_token', res.access_token);
            userToken = res.access_token;
            loadContent();
        }
    }, interval * 1000);
}

function updateNav() {
    const menuItems = document.querySelectorAll('.menu-item');
    const indicator = document.getElementById('nav-indicator');
    const active = menuItems[currentFocusIndex];
    
    indicator.style.opacity = inMenu ? "1" : "0.3";
    indicator.style.width = active.offsetWidth + 'px';
    indicator.style.left = active.offsetLeft + 'px';
    
    menuItems.forEach((m, i) => m.classList.toggle('active-text', i === currentFocusIndex));
}

function handleKeydown(e) {
    const menuItems = document.querySelectorAll('.menu-item');
    
    if (inMenu) {
        if (e.keyCode === 39 && currentFocusIndex < menuItems.length - 1) { 
            currentFocusIndex++; updateNav(); loadContent(); 
        }
        if (e.keyCode === 37 && currentFocusIndex > 0) { 
            currentFocusIndex--; updateNav(); loadContent(); 
        }
        if (e.keyCode === 40 && menuItems[currentFocusIndex].id === 'menu-home') { 
            inMenu = false; updateNav(); updateCarouselPosition(); 
        }
        if (e.keyCode === 13 && menuItems[currentFocusIndex].id === 'menu-profile' && userToken) {
            localStorage.removeItem('twitch_access_token');
            userToken = '';
            loadContent();
        }
    } else {
        if (e.keyCode === 39 && streamFocusIndex < streamsData.length - 1) { streamFocusIndex++; updateCarouselPosition(); }
        if (e.keyCode === 37 && streamFocusIndex > 0) { streamFocusIndex--; updateCarouselPosition(); }
        if (e.keyCode === 38) { inMenu = true; updateNav(); updateCarouselPosition(); }
    }
}