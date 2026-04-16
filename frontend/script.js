
let STORE_DATA = [];
let ACCESS_TOKEN = localStorage.getItem('enjambre_token') || "";
let USERNAME = localStorage.getItem('enjambre_user') || "";

document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');

    if (isLoggedIn === 'true' && ACCESS_TOKEN) {
        
        showMainContent();
    } else {
    
        showLoginScreen();
    }
    updateCartBadge();
});

async function handleLogin() {
    const userVal = document.getElementById('username').value;
    const passVal = document.getElementById('password').value;

    if (!userVal || !passVal) return alert("Isi username dan password!");

    try {
        const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: userVal, password: passVal })
        });

        if (response.ok) {
            const result = await response.json();
            
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('enjambre_token', result.token);
            localStorage.setItem('enjambre_user', userVal);
            
            ACCESS_TOKEN = result.token;
            USERNAME = userVal;

            showMainContent();
        } else {
            alert("Login Gagal. Periksa kembali akun Anda.");
        }
    } catch (err) {
        console.error("Login Error:", err);
        alert("Server tidak merespon.");
    }
}

function handleLogout() {
    // Bersihkan semua data session
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('enjambre_token');
    localStorage.removeItem('enjambre_user');
    // localStorage.removeItem('enjambre_cart'); // Opsional: hapus keranjang saat logout

    location.reload(); // Kembali ke tampilan awal (Login)
}

// --- 3. UI NAVIGATION CONTROL ---
function showMainContent() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    document.getElementById('game-detail-screen').style.display = 'none';
    document.getElementById('user-name-display').innerText = USERNAME;
    
    fetchStoreItems();
}

function showLoginScreen() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('main-content').style.display = 'none';
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
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        STORE_DATA = await response.json();
        renderGames(STORE_DATA);
    } catch (err) {
        console.error("Fetch Error:", err);
    }
}

function renderGames(items) {
    const grid = document.getElementById('game-list');
    if (!grid) return;
    grid.innerHTML = "";
    items.forEach(game => {
        grid.innerHTML += `
            <div class="game-card" onclick="showGameDetail(${game.id})">
                <img src="${game.image}" alt="${game.title}" class="card-cover">
                <div class="game-info">
                    <h3>${game.title}</h3>
                    <p class="price">Rp ${(game.price || 0).toLocaleString('id-ID')}</p>
                    <button onclick="event.stopPropagation(); handleAddToCart(${game.id})" class="btn-buy">Add to Cart</button>
                </div>
            </div>`;
    });
}

// --- 5. CART & NOTIFICATION ---
function handleAddToCart(gameId) {
    const game = STORE_DATA.find(g => g.id === gameId);
    if (!game) return;

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

    content.innerHTML = `
        <div class="detail-layout">
            <div class="detail-image-container">
                <img src="${game.image}" class="detail-cover">
            </div>
            <div class="detail-info">
                <h1>${game.title}</h1>
                <span class="price-tag">Rp ${game.price.toLocaleString('id-ID')}</span>
                <button onclick="handleAddToCart(${game.id})" class="btn-buy" style="width: 250px;">Add to Cart</button>
                <div class="description">
                    <h3>Overview</h3>
                    <p>Experience the next generation of gaming with ${game.title}. Masterpiece graphics and immersive storytelling await.</p>
                </div>
            </div>
        </div>`;
}

function closeDetail() {
    document.getElementById('game-detail-screen').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
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