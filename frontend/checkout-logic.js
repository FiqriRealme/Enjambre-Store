document.addEventListener('DOMContentLoaded', () => {
    renderCheckout();
});

function getCheckoutLibrary() {
    return JSON.parse(localStorage.getItem('enjambre_library')) || [];
}

function getCheckoutCart() {
    return JSON.parse(localStorage.getItem('enjambre_cart')) || [];
}

function renderCheckout() {
    const cart = getCheckoutCart();
    const library = getCheckoutLibrary();
    const ownedIds = new Set(library.map((item) => item.id));
    const list = document.getElementById('checkout-list');
    const notice = document.getElementById('checkout-notice');
    const confirmButton = document.getElementById('confirm-order-btn');
    let total = 0;
    let purchasableCount = 0;
    let ownedInCartCount = 0;

    if (cart.length === 0) {
        location.href = 'index.html';
        return;
    }

    list.innerHTML = "";
    cart.forEach(item => {
        const isOwned = ownedIds.has(item.id);

        if (!isOwned) {
            total += item.price;
            purchasableCount += 1;
        } else {
            ownedInCartCount += 1;
        }

        list.innerHTML += `
            <div class="checkout-item ${isOwned ? 'owned-item' : ''}">
                <img src="${item.image}">
                <div>
                    <span class="checkout-item-status" style="color: ${isOwned ? '#ffd166' : '#00d1ff'};">${isOwned ? 'ALREADY IN LIBRARY' : 'READY TO ORDER'}</span>
                    <h4>${item.title}</h4>
                    <p>Rp ${item.price.toLocaleString('id-ID')}</p>
                    <p style="color: rgba(255,255,255,0.62); margin: 8px 0 0;">${isOwned ? 'Item ini tidak akan diproses saat kamu menekan Place Order.' : 'Item ini akan dipindahkan ke library setelah pembayaran berhasil.'}</p>
                </div>
            </div>`;
    });

    document.getElementById('total-price').innerText = `Rp ${total.toLocaleString('id-ID')}`;
    document.getElementById('grand-total').innerText = `Rp ${total.toLocaleString('id-ID')}`;

    if (notice) {
        if (ownedInCartCount > 0 && purchasableCount > 0) {
            notice.style.display = 'block';
            notice.innerText = `${ownedInCartCount} game di keranjang sudah kamu miliki. Hanya ${purchasableCount} game baru yang akan diproses saat order.`;
        } else if (ownedInCartCount > 0 && purchasableCount === 0) {
            notice.style.display = 'block';
            notice.innerText = `Semua game di keranjang sudah ada di library kamu. Order baru tidak bisa diproses sampai kamu menambahkan game yang belum dimiliki.`;
        } else {
            notice.style.display = 'none';
            notice.innerText = '';
        }
    }

    if (confirmButton) {
        confirmButton.disabled = purchasableCount === 0;
        confirmButton.innerText = purchasableCount === 0 ? 'ALREADY OWNED' : 'PLACE ORDER';
    }
}

function confirmPayment() {
    const cart = getCheckoutCart();
    let library = getCheckoutLibrary();
    const ownedIds = new Set(library.map((item) => item.id));
    const purchasableItems = cart.filter((item) => !ownedIds.has(item.id));
    const remainingCartItems = cart.filter((item) => ownedIds.has(item.id));

    if (purchasableItems.length === 0) {
        alert("Tidak ada game baru yang bisa diproses. Semua item di keranjang sudah ada di library kamu.");
        renderCheckout();
        return;
    }

    const updatedLibrary = [...library, ...purchasableItems];

    localStorage.setItem('enjambre_library', JSON.stringify(updatedLibrary));
    localStorage.setItem('enjambre_cart', JSON.stringify(remainingCartItems));

    alert("Payment Successful! Game baru kamu sekarang sudah masuk ke Library.");
    window.location.href = 'library.html';
}
