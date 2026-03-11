// Data Library dari LocalStorage
let MY_GAMES = JSON.parse(localStorage.getItem('enjambre_library')) || [];

document.addEventListener('DOMContentLoaded', () => {
    renderLibrary(MY_GAMES);
    updateQuickLaunch();
});

function renderLibrary(games) {
    const grid = document.getElementById('library-grid');
    if (!grid) return;

    if (games.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-gamepad" style="font-size: 50px; color: #333; margin-bottom: 20px;"></i>
                <p>You don't own any games yet.</p>
                <button onclick="location.href='index.html'" class="btn-browse">Browse Store</button>
            </div>`;
        return;
    }

    grid.innerHTML = "";
    games.forEach(game => {
        grid.innerHTML += `
            <div class="lib-card">
                <div class="img-container">
                    <img src="${game.image}" alt="${game.title}">
                    <div class="overlay">
                        <button class="btn-launch"><i class="fas fa-play"></i> Launch</button>
                    </div>
                </div>
                <div class="lib-info">
                    <h4>${game.title}</h4>
                    <p>Installed</p>
                </div>
            </div>`;
    });
}

function updateQuickLaunch() {
    const qlContainer = document.getElementById('ql-container');
    // Ambil 3 game terakhir yang dibeli
    const recentGames = MY_GAMES.slice(-3).reverse();

    qlContainer.innerHTML = "";
    recentGames.forEach(game => {
        qlContainer.innerHTML += `
            <div class="ql-item">
                <img src="${game.image}" alt="">
                <span>${game.title}</span>
            </div>`;
    });
}

function searchLibrary() {
    const query = document.getElementById('lib-search').value.toLowerCase();
    const filtered = MY_GAMES.filter(g => g.title.toLowerCase().includes(query));
    renderLibrary(filtered);
}