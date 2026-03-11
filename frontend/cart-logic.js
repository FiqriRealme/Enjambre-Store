// --- Di cart-logic.js ---

document.addEventListener('DOMContentLoaded', () => {
    renderCart();
});

function renderCart() {
    const cartList = document.getElementById('cart-items-list');
    const subtotalEl = document.getElementById('subtotal-price');
    const totalEl = document.getElementById('total-price-final');
    
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
        totalHarga += item.price;
        cartList.innerHTML += `
            <div class="cart-item">
                <img src="${item.image}" class="item-img">
                <div class="item-info">
                    <span style="color: #00d1ff; font-size: 12px;">BASE GAME</span>
                    <h4>${item.title}</h4>
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

    if (cart.length === 0) {
        alert("Keranjang Anda masih kosong. Silakan pilih game terlebih dahulu!");
        return;
    }

    // Pindah ke halaman checkout
    window.location.href = 'checkout.html';
}