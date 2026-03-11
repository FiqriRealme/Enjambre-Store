document.addEventListener('DOMContentLoaded', () => {
    renderCheckout();
});

function renderCheckout() {
    const cart = JSON.parse(localStorage.getItem('enjambre_cart')) || [];
    const list = document.getElementById('checkout-list');
    let total = 0;

    if (cart.length === 0) {
        location.href = 'index.html';
        return;
    }

    list.innerHTML = "";
    cart.forEach(item => {
        total += item.price;
        list.innerHTML += `
            <div class="checkout-item">
                <img src="${item.image}">
                <div>
                    <h4>${item.title}</h4>
                    <p>Rp ${item.price.toLocaleString('id-ID')}</p>
                </div>
            </div>`;
    });

    document.getElementById('total-price').innerText = `Rp ${total.toLocaleString('id-ID')}`;
    document.getElementById('grand-total').innerText = `Rp ${total.toLocaleString('id-ID')}`;
}

function confirmPayment() {
    // 1. Ambil data dari cart
    const cart = JSON.parse(localStorage.getItem('enjambre_cart')) || [];
    
    // 2. Ambil data library yang sudah ada (atau array kosong)
    let library = JSON.parse(localStorage.getItem('enjambre_library')) || [];

    // 3. Gabungkan (Simulasi sukses bayar)
    // Gunakan Spread Operator untuk menggabungkan array
    const updatedLibrary = [...library, ...cart];

    // 4. Simpan ke library, hapus cart
    localStorage.setItem('enjambre_library', JSON.stringify(updatedLibrary));
    localStorage.removeItem('enjambre_cart');

    alert("Payment Successful! Your games are now in the Library.");
    
    // 5. Redirect ke Library
    window.location.href = 'library.html';
}