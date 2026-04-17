
let STORE_DATA = [];
let ACCESS_TOKEN = localStorage.getItem('enjambre_token') || "";
let USERNAME = localStorage.getItem('enjambre_user') || "";
let GOOGLE_CLIENT_ID = "";
let CURRENT_USER_KEY = localStorage.getItem('enjambre_profile_key') || "";
let CURRENT_USER_EMAIL = localStorage.getItem('enjambre_user_email') || "";
let CURRENT_USER_AVATAR = localStorage.getItem('enjambre_user_avatar') || "https://i.pravatar.cc/150?u=bex";
let IS_PROFILE_SETUP_REQUIRED = false;

document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const profileTrigger = document.getElementById('user-profile-trigger');
    const photoInput = document.getElementById('profile-photo-input');

    if (profileTrigger) {
        profileTrigger.addEventListener('click', () => {
            if (localStorage.getItem('isLoggedIn') === 'true') {
                openProfileSetup(false);
            }
        });
    }

    if (photoInput) {
        photoInput.addEventListener('change', handleProfilePhotoChange);
    }

    if (isLoggedIn === 'true' && ACCESS_TOKEN) {
        
        showMainContent();
    } else {
    
        showLoginScreen();
    }
    initGoogleLogin();
    updateCartBadge();
});

async function handleLogin() {
    const userVal = document.getElementById('username').value;
    const passVal = document.getElementById('password').value;

    if (!userVal || !passVal) {
        alert("Isi username dan password!");
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: userVal,
                password: passVal
            })
        });

        const result = await response.json();

        if (response.ok) {
            setSessionUser({
                token: result.token,
                username: userVal,
                email: result.email || "",
                avatar: result.picture || "",
                isNewUser: false
            });
            showMainContent();

        } else {
            alert(result.message || "Login gagal");
        }

    } catch (err) {
        console.error(err);
        alert("Server tidak merespon");
    }
}

async function initGoogleLogin() {
    const googleSection = document.getElementById('google-login-section');
    const googleButton = document.getElementById('google-login-button');

    if (!googleSection || !googleButton) return;

    try {
        const response = await fetch('http://localhost:5000/api/auth/google/config');
        const result = await response.json();

        if (!response.ok || !result.clientId) {
            googleSection.style.display = 'none';
            return;
        }

        GOOGLE_CLIENT_ID = result.clientId;

        const googleReady = await waitForGoogleIdentityServices();

        if (!googleReady) {
            googleSection.style.display = 'none';
            return;
        }

        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse
        });

        window.google.accounts.id.renderButton(googleButton, {
            theme: 'outline',
            size: 'large',
            shape: 'pill',
            width: 300,
            text: 'signin_with'
        });
    } catch (err) {
        console.error("Google init error:", err);
        googleSection.style.display = 'none';
    }
}

async function waitForGoogleIdentityServices(maxAttempts = 20) {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        if (window.google && window.google.accounts && window.google.accounts.id) {
            return true;
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return false;
}

async function handleGoogleCredentialResponse(response) {
    try {
        const apiResponse = await fetch('http://localhost:5000/api/auth/google', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                credential: response.credential
            })
        });

        const result = await apiResponse.json();

        if (!apiResponse.ok) {
            alert(result.message || "Login Google gagal");
            return;
        }

        setSessionUser({
            token: result.token,
            username: result.username,
            email: result.email || "",
            avatar: result.picture || "",
            isNewUser: Boolean(result.isNewUser)
        });
        showMainContent();
    } catch (err) {
        console.error("Google login error:", err);
        alert("Login Google gagal diproses");
    }
}

function setSessionUser({ token, username, email = "", avatar = "", isNewUser = false }) {
    ACCESS_TOKEN = token;
    USERNAME = username;
    CURRENT_USER_EMAIL = email;
    CURRENT_USER_KEY = email || username;
    CURRENT_USER_AVATAR = avatar || getStoredProfile()?.avatar || "https://i.pravatar.cc/150?u=bex";
    IS_PROFILE_SETUP_REQUIRED = isNewUser && !getStoredProfile();

    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('enjambre_token', token);
    localStorage.setItem('enjambre_user', username);
    localStorage.setItem('enjambre_profile_key', CURRENT_USER_KEY);
    localStorage.setItem('enjambre_user_email', CURRENT_USER_EMAIL);
    localStorage.setItem('enjambre_user_avatar', CURRENT_USER_AVATAR);
}

function getProfilesMap() {
    try {
        return JSON.parse(localStorage.getItem('enjambre_profiles')) || {};
    } catch (error) {
        return {};
    }
}

function getStoredProfile() {
    if (!CURRENT_USER_KEY) return null;
    const profiles = getProfilesMap();
    return profiles[CURRENT_USER_KEY] || null;
}

function applyActiveProfile() {
    const profile = getStoredProfile();
    const displayName = profile?.displayName || USERNAME || "Player";
    const avatar = profile?.avatar || CURRENT_USER_AVATAR || "https://i.pravatar.cc/150?u=bex";
    const nameDisplay = document.getElementById('user-name-display');
    const avatarDisplay = document.getElementById('user-avatar');

    USERNAME = displayName;
    CURRENT_USER_AVATAR = avatar;

    localStorage.setItem('enjambre_user', displayName);
    localStorage.setItem('enjambre_user_avatar', avatar);

    if (nameDisplay) {
        nameDisplay.innerText = displayName;
    }

    if (avatarDisplay) {
        avatarDisplay.src = avatar;
    }
}

function openProfileSetup(isFirstTime = false) {
    const overlay = document.getElementById('profile-setup-overlay');
    const nameInput = document.getElementById('profile-display-name');
    const avatarPreview = document.getElementById('profile-preview-avatar');
    const skipButton = document.getElementById('profile-skip-btn');
    const profile = getStoredProfile();
    const previewAvatar = profile?.avatar || CURRENT_USER_AVATAR || "https://i.pravatar.cc/150?u=bex";
    const previewName = profile?.displayName || USERNAME || "";

    if (!overlay || !nameInput || !avatarPreview) return;

    nameInput.value = previewName;
    avatarPreview.src = previewAvatar;
    avatarPreview.dataset.selectedImage = previewAvatar;

    if (skipButton) {
        skipButton.style.display = isFirstTime ? 'inline-flex' : 'inline-flex';
    }

    overlay.classList.add('active');
}

function closeProfileSetup() {
    const overlay = document.getElementById('profile-setup-overlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    IS_PROFILE_SETUP_REQUIRED = false;
}

function handleProfilePhotoChange(event) {
    const file = event.target.files?.[0];
    const avatarPreview = document.getElementById('profile-preview-avatar');

    if (!file || !avatarPreview) return;

    if (!file.type.startsWith('image/')) {
        alert("File harus berupa gambar.");
        event.target.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        avatarPreview.src = reader.result;
        avatarPreview.dataset.selectedImage = reader.result;
    };
    reader.readAsDataURL(file);
}

function saveProfileSetup() {
    const nameInput = document.getElementById('profile-display-name');
    const avatarPreview = document.getElementById('profile-preview-avatar');

    if (!CURRENT_USER_KEY || !nameInput || !avatarPreview) {
        closeProfileSetup();
        return;
    }

    const displayName = nameInput.value.trim() || USERNAME || "Player";
    const avatar = avatarPreview.dataset.selectedImage || avatarPreview.src || CURRENT_USER_AVATAR || "https://i.pravatar.cc/150?u=bex";
    const profiles = getProfilesMap();

    profiles[CURRENT_USER_KEY] = {
        displayName,
        avatar
    };

    localStorage.setItem('enjambre_profiles', JSON.stringify(profiles));
    USERNAME = displayName;
    CURRENT_USER_AVATAR = avatar;

    applyActiveProfile();
    closeProfileSetup();
}

function handleLogout() {
    // Bersihkan semua data session
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('enjambre_token');
    localStorage.removeItem('enjambre_user');
    localStorage.removeItem('enjambre_profile_key');
    localStorage.removeItem('enjambre_user_email');
    localStorage.removeItem('enjambre_user_avatar');
    // localStorage.removeItem('enjambre_cart'); // Opsional: hapus keranjang saat logout

    location.reload(); // Kembali ke tampilan awal (Login)
}

// --- 3. UI NAVIGATION CONTROL ---
function showMainContent() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    document.getElementById('game-detail-screen').style.display = 'none';
    applyActiveProfile();

    const decoded = parseJwt(ACCESS_TOKEN);
    if (decoded) {
        console.log("Login sebagai:", decoded.role);
    }

    fetchStoreItems();

    if (IS_PROFILE_SETUP_REQUIRED) {
        openProfileSetup(true);
    }
}

function showLoginScreen() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('main-content').style.display = 'none';
}

function showStore() {
    closeDetail();
}

function showCart() {
    window.location.href = 'cart.html';
}

function goHome() {
    // Fungsi untuk logo: Jika sudah login, balik ke Store. Jika belum, ke Login.
    if (localStorage.getItem('isLoggedIn') === 'true') {
        closeDetail(); // Menutup detail dan kembali ke grid game
    } else {
        location.reload();
    }
}

// --- 4. STORE & RENDERING ---
async function fetchStoreItems() {
    if (!ACCESS_TOKEN) return;

    try {
        const response = await fetch('http://localhost:5000/api/games', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            alert("Session expired, silakan login ulang.");
            handleLogout();
            return;
        }

        STORE_DATA = await response.json();
        renderGames(STORE_DATA);

    } catch (err) {
        console.error("Fetch Error:", err);
        alert("Gagal mengambil data game.");
    }
}

function renderGames(items) {
    const grid = document.getElementById('game-list');
    if (!grid) return;
    const ownedIds = new Set((JSON.parse(localStorage.getItem('enjambre_library')) || []).map((item) => item.id));
    grid.innerHTML = "";
    items.forEach(game => {
        const isOwned = ownedIds.has(game.id);
        grid.innerHTML += `
            <div class="game-card" onclick="showGameDetail(${game.id})">
                <img src="${game.image}" alt="${game.title}" class="card-cover">
                <div class="game-info">
                    <span class="game-genre-pill">${sanitizeText(game.genre || 'Action')}</span>
                    <h3>${game.title}</h3>
                    <p class="price">Rp ${(game.price || 0).toLocaleString('id-ID')}</p>
                    <button onclick="event.stopPropagation(); handleAddToCart(${game.id})" class="btn-buy" ${isOwned ? 'disabled' : ''}>${isOwned ? 'Already in Library' : 'Add to Cart'}</button>
                </div>
            </div>`;
    });
}

// --- 5. CART & NOTIFICATION ---
function handleAddToCart(gameId) {
    const game = STORE_DATA.find(g => g.id === gameId);
    if (!game) return;
    const library = JSON.parse(localStorage.getItem('enjambre_library')) || [];
    const alreadyOwned = library.some((item) => item.id === gameId);

    if (alreadyOwned) {
        alert("Game ini sudah ada di library kamu.");
        return;
    }

    let cart = JSON.parse(localStorage.getItem('enjambre_cart')) || [];
    const isExist = cart.some(item => item.id === gameId);
    
    if (!isExist) {
        cart.push({
            id: game.id,
            title: game.title,
            price: game.price,
            image: game.image
        });
        localStorage.setItem('enjambre_cart', JSON.stringify(cart));
        updateCartBadge(); 
        showEpicNotification(game);
    } else {
        alert("Game sudah ada di keranjang!");
    }
}

function updateCartBadge() {
    const badge = document.getElementById('cart-count');
    if (!badge) return;
    const cart = JSON.parse(localStorage.getItem('enjambre_cart')) || [];
    badge.innerText = cart.length;
    badge.style.display = cart.length > 0 ? 'flex' : 'none';
}

function showEpicNotification(game) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notif = document.createElement('div');
    notif.className = 'epic-notif';
    notif.innerHTML = `
        <img src="${game.image}" class="notif-img">
        <div class="notif-text">
            <h4>SUKSES!</h4>
            <p>${game.title} masuk keranjang.</p>
        </div>`;

    container.appendChild(notif);
    setTimeout(() => {
        notif.classList.add('fade-out');
        setTimeout(() => notif.remove(), 500);
    }, 3000);
}

// --- 6. DETAIL SCREEN ---
function showGameDetail(id) {
    const game = STORE_DATA.find(g => g.id === id);
    if (!game) return;

    const detailScreen = document.getElementById('game-detail-screen');
    const content = document.getElementById('detail-content');

    document.getElementById('main-content').style.display = 'none';
    detailScreen.style.display = 'block';
    const gallery = (game.gameplayScreenshots && game.gameplayScreenshots.length > 0)
        ? game.gameplayScreenshots
        : [game.heroImage || game.image, game.image].filter(Boolean);
    const library = JSON.parse(localStorage.getItem('enjambre_library')) || [];
    const cart = JSON.parse(localStorage.getItem('enjambre_cart')) || [];
    const isOwned = library.some((item) => item.id === id);
    const isInCart = cart.some((item) => item.id === id);
    const buttonLabel = isOwned ? 'Already in Library' : (isInCart ? 'Already in Cart' : 'Add to Cart');
    const buttonDisabled = isOwned || isInCart;
    const primaryImage = gallery[0] || game.heroImage || game.image;
    const reviewLabel = game.reviewSummary || 'Strong reception';
    const reviewCount = Number(game.reviewCount || 0).toLocaleString('en-US');
    const categories = (game.categories || []).slice(0, 6);
    const genres = game.genres || [game.genre];
    const platforms = game.platforms || ['Windows'];
    const developers = (game.developers || []).join(', ') || 'Studio information unavailable';
    const publishers = (game.publishers || []).join(', ') || 'Publisher information unavailable';
    const positivePercent = game.reviewPositivePercent ? `${game.reviewPositivePercent}% positive` : 'Community feedback available';
    const criticScore = game.criticScore ? `${game.criticScore}/100 critic score` : 'Critic score unavailable';
    const achievements = game.achievements ? `${game.achievements} achievements` : 'Achievement support varies by title';

    content.innerHTML = `
        <div class="detail-page">
            <div class="detail-topbar">
                <div>
                    <p class="detail-eyebrow">${sanitizeText(game.genre || genres[0] || 'Featured Game')}</p>
                    <h1>${sanitizeText(game.title)}</h1>
                    <p class="detail-subtitle">${sanitizeText(game.shortDescription || game.description || '')}</p>
                </div>
                <div class="detail-top-actions">
                    <span class="detail-chip">${sanitizeText(game.ageRating || '13+')}</span>
                    <span class="detail-chip">${sanitizeText(reviewLabel)}</span>
                </div>
            </div>

            <div class="detail-layout epic-style-layout">
                <div class="detail-main-column">
                    <div class="detail-hero-frame">
                        <img id="detail-main-image" src="${primaryImage}" class="detail-hero-image" alt="${sanitizeText(game.title)}">
                    </div>

                    <div class="detail-gallery-strip">
                        ${gallery.map((shot, index) => `
                            <button class="detail-thumb ${index === 0 ? 'active' : ''}" onclick="setDetailMedia('${escapeJsString(shot)}', this)">
                                <img src="${shot}" alt="Screenshot ${index + 1}">
                            </button>
                        `).join('')}
                    </div>

                    <div class="detail-tabs">
                        <span class="active">Overview</span>
                        <span>Reviews</span>
                        <span>Game Details</span>
                    </div>

                    <section class="detail-section">
                        <div class="detail-section-header">
                            <h3>About This Game</h3>
                            <p>Storefront detail inspired by modern PC game pages.</p>
                        </div>
                        <p class="detail-long-copy">${sanitizeText(game.description || '')}</p>
                    </section>

                    <section class="detail-section stat-grid-section">
                        <div class="detail-stat-card">
                            <span class="stat-label">Player Rating</span>
                            <strong>${renderStars(game.starRating || 4.2)}</strong>
                            <p>${positivePercent}</p>
                        </div>
                        <div class="detail-stat-card">
                            <span class="stat-label">Review Summary</span>
                            <strong>${sanitizeText(reviewLabel)}</strong>
                            <p>${reviewCount} community reviews</p>
                        </div>
                        <div class="detail-stat-card">
                            <span class="stat-label">Critic Signal</span>
                            <strong>${sanitizeText(criticScore)}</strong>
                            <p>${sanitizeText(achievements)}</p>
                        </div>
                    </section>

                    <section class="detail-section">
                        <div class="detail-section-header">
                            <h3>Player Review Snapshot</h3>
                            <p>Quick read on how the community sees this release.</p>
                        </div>
                        <div class="review-cards">
                            <article class="review-card">
                                <span class="review-badge">${renderStars(game.starRating || 4.2)}</span>
                                <h4>${sanitizeText(reviewLabel)}</h4>
                                <p>${sanitizeText(game.title)} is drawing ${positivePercent.toLowerCase()} with ${reviewCount} total community reviews on its referenced store data.</p>
                            </article>
                            <article class="review-card">
                                <span class="review-badge">${sanitizeText(game.ageRating || '13+')}</span>
                                <h4>Age Guidance</h4>
                                <p>Recommended for players rated ${sanitizeText(game.ageRating || '13+')} because of ${sanitizeText(game.ageReason || 'general gameplay themes')}.</p>
                            </article>
                            <article class="review-card">
                                <span class="review-badge">${genres.length}</span>
                                <h4>Play Style</h4>
                                <p>Best known for ${sanitizeText(genres.slice(0, 3).join(', '))} gameplay with ${sanitizeText(categories.slice(0, 3).join(', ').toLowerCase())} support.</p>
                            </article>
                        </div>
                    </section>
                </div>

                <aside class="detail-side-panel">
                    <div class="detail-side-card">
                        <img src="${game.image}" class="detail-side-cover" alt="${sanitizeText(game.title)}">
                        <span class="detail-tag">Base Game</span>
                        <div class="price-tag">Rp ${(game.price || 0).toLocaleString('id-ID')}</div>
                        <button onclick="handleAddToCart(${game.id}); ${buttonDisabled ? '' : 'showGameDetail(' + game.id + ');'}" class="btn-buy detail-buy-btn" ${buttonDisabled ? 'disabled' : ''}>${buttonLabel}</button>
                        <a href="${game.storePage || game.website || '#'}" target="_blank" rel="noopener noreferrer" class="detail-secondary-link">Open Reference Page</a>
                    </div>

                    <div class="detail-side-card info-stack">
                        <div class="info-row">
                            <span>Age Rating</span>
                            <strong>${sanitizeText(game.ageRating || '13+')}</strong>
                        </div>
                        <div class="info-row">
                            <span>Reason</span>
                            <strong>${sanitizeText(game.ageReason || 'General gameplay themes')}</strong>
                        </div>
                        <div class="info-row">
                            <span>Developer</span>
                            <strong>${sanitizeText(developers)}</strong>
                        </div>
                        <div class="info-row">
                            <span>Publisher</span>
                            <strong>${sanitizeText(publishers)}</strong>
                        </div>
                        <div class="info-row">
                            <span>Release Date</span>
                            <strong>${sanitizeText(game.releaseDate || 'TBA')}</strong>
                        </div>
                        <div class="info-row">
                            <span>Platforms</span>
                            <strong>${sanitizeText(platforms.join(', '))}</strong>
                        </div>
                    </div>

                    <div class="detail-side-card">
                        <h4 class="side-card-title">Highlights</h4>
                        <div class="detail-pill-group">
                            ${categories.map((category) => `<span class="detail-pill">${sanitizeText(category)}</span>`).join('')}
                        </div>
                    </div>
                </aside>
            </div>
        </div>`;
}

function closeDetail() {
    document.getElementById('game-detail-screen').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
}

function setDetailMedia(imageUrl, button) {
    const mainImage = document.getElementById('detail-main-image');
    if (!mainImage) return;
    mainImage.src = imageUrl;
    document.querySelectorAll('.detail-thumb').forEach((item) => item.classList.remove('active'));
    if (button) {
        button.classList.add('active');
    }
}

// --- 7. UTILS (Search & Key) ---
function filterGames() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const result = STORE_DATA.filter(g => g.title.toLowerCase().includes(query));
    renderGames(result);
}

function toggleKey() {
    const info = document.getElementById('key-info');
    if (!info) return;
    info.style.display = (info.style.display === 'none' || info.style.display === '') ? 'block' : 'none';
}

function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
}

function sanitizeText(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/â€™/g, "'")
        .replace(/Â/g, '')
        .replace(/™/g, '');
}

function escapeJsString(value) {
    return String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function renderStars(value) {
    const rating = Number(value || 4);
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return `${'★'.repeat(fullStars)}${halfStar ? '½' : ''}${'☆'.repeat(emptyStars)} <span>${rating.toFixed(1)}/5</span>`;
}
