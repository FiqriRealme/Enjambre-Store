// --- Di cart-logic.js ---

document.addEventListener('DOMContentLoaded', () => {
    applyCartUserProfile();
    renderCart();
});

function getOwnedGameIds() {
    const library = JSON.parse(localStorage.getItem('enjambre_library')) || [];
    return new Set(library.map((item) => item.id));
}

function getCartProfilesMap() {
    try {
        return JSON.parse(localStorage.getItem('enjambre_profiles')) || {};
    } catch (error) {
        return {};
    }
}

function applyCartUserProfile() {
    const userKey = localStorage.getItem('enjambre_profile_key') || localStorage.getItem('enjambre_user_email') || localStorage.getItem('enjambre_user') || '';
    const profiles = getCartProfilesMap();
    const activeProfile = profiles[userKey] || null;
    const userName = activeProfile?.displayName || localStorage.getItem('enjambre_user') || 'Player One';
    const userEmail = localStorage.getItem('enjambre_user_email') || 'Signed in player';
    const userAvatar = activeProfile?.avatar || localStorage.getItem('enjambre_user_avatar') || 'https://i.pravatar.cc/150?u=bex';
    const userNameEl = document.getElementById('cart-user-name');
    const userEmailEl = document.getElementById('cart-user-email');
    const userAvatarEl = document.getElementById('cart-user-avatar');

    if (userNameEl) {
        userNameEl.innerText = userName;
    }

    if (userEmailEl) {
        userEmailEl.innerText = userEmail || 'Signed in player';
    }

    if (userAvatarEl) {
        userAvatarEl.src = userAvatar;
    }
}

function renderCart() {
    const cartList = document.getElementById('cart-items-list');
    const subtotalEl = document.getElementById('subtotal-price');
    const totalEl = document.getElementById('total-price-final');
    const ownedIds = getOwnedGameIds();
    
    let cart = JSON.parse(localStorage.getItem('enjambre_cart')) || [];
    
    if (cart.length === 0) {
        cartList.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <h3>Your cart is empty</h3>
                <a href="index.html" style="color: #00d1ff;">Back to Store</a>
            </div>`;
        subtotalEl.innerText = "Rp 0";
        totalEl.innerText = "Rp 0";
        return;
    }

    let totalHarga = 0;
    cartList.innerHTML = ""; 

    cart.forEach((item, index) => {
        const isOwned = ownedIds.has(item.id);

        if (!isOwned) {
            totalHarga += item.price;
        }

        cartList.innerHTML += `
            <div class="cart-item ${isOwned ? 'owned-item' : ''}">
                <img src="${item.image}" class="item-img">
                <div class="item-info">
                    <span style="color: ${isOwned ? '#ffd166' : '#00d1ff'}; font-size: 12px;">${isOwned ? 'ALREADY OWNED' : 'BASE GAME'}</span>
                    <h4>${item.title}</h4>
                    <p class="item-meta">${isOwned ? 'Game ini sudah ada di library kamu. Item tetap boleh berada di keranjang, tetapi tidak akan ikut diproses saat order.' : 'Ready for checkout on this account. After payment, the game will be added straight to your library.'}</p>
                    <p>Rp ${item.price.toLocaleString('id-ID')}</p>
                    <button class="remove-btn" onclick="removeItem(${index})">Remove</button>
                </div>
            </div>
        `;
    });

    subtotalEl.innerText = `Rp ${totalHarga.toLocaleString('id-ID')}`;
    totalEl.innerText = `Rp ${totalHarga.toLocaleString('id-ID')}`;
}

// Fungsi Remove ditutup di sini (perbaikan bracket)
function removeItem(index) {
    let cart = JSON.parse(localStorage.getItem('enjambre_cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('enjambre_cart', JSON.stringify(cart));
    renderCart();
}

// SEKARANG FUNGSI INI BERDIRI SENDIRI (BISA DIAKSES TOMBOL)
function processCheckout() {
    const cart = JSON.parse(localStorage.getItem('enjambre_cart')) || [];
    const ownedIds = getOwnedGameIds();
    const purchasableItems = cart.filter((item) => !ownedIds.has(item.id));

    if (cart.length === 0) {
        alert("Keranjang Anda masih kosong. Silakan pilih game terlebih dahulu!");
        return;
    }

    if (purchasableItems.length === 0) {
        alert("Semua game di keranjang sudah ada di library kamu. Hapus item yang sudah dimiliki atau tambahkan game baru.");
        return;
    }

    // Pindah ke halaman checkout
    window.location.href = 'checkout.html';
}
