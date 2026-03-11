const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const hash = bcrypt.hashSync("zivelamunich", 10);
let users = [{ username: "hitlerkusuma", password: hash }]; 

let games = [
    { id: 1, title: "The Last of Us Part II", 
        price: 800000, genre: "Action", 
        image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1888510/header.jpg",
        gameplayScreenshots: [
            "https://images.unsplash.com/photo-1581093122177-380d603a11f2?q=80&w=600",
            "https://images.unsplash.com/photo-1581093121966-51e0892095f3?q=80&w=600",
            "https://images.unsplash.com/photo-1581093122177-380d603a11f2?q=80&w=600",
            "https://images.unsplash.com/photo-1581093121966-51e0892095f3?q=80&w=600"
        ]

    },
    { id: 2, title: "Spider-Man Miles Morales", price: 729000, genre: "Action", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1817190/header.jpg" },
    { id: 3, title: "Elden Ring", price: 599000, genre: "RPG", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg" },
    { id: 4, title: "Cyberpunk 2077", price: 699999, genre: "Open World", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg" },
    { id: 5, title: "God of War Ragnarok", price: 879000, genre: "Action", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2322010/header.jpg" },
    { id: 6, title: "Red Dead Redemption 2", price: 640000, genre: "Adventure", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1174180/header.jpg" },
    { id: 7, title: "Resident Evil 4 Remake", price: 830000, genre: "Horror", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2050650/header.jpg" },
    { id: 8, title: "Hogwarts Legacy", price: 799000, genre: "Fantasy", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1559650/header.jpg" },
    { id: 9, title: "Baldur's Gate 3", price: 699000, genre: "RPG", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1086940/header.jpg" },
    { id: 10, title: "Ghost of Tsushima", price: 879000, genre: "Open World", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2215430/header.jpg" },
    { id: 11, title: "Grand Theft Auto V", price: 400000, genre: "Action", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/271590/header.jpg" },
    { id: 12, title: "Final Fantasy VII Rebirth", price: 900000, genre: "RPG", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2124490/header.jpg" },
    { id: 13, title: "Sekiro: Shadows Die Twice", price: 890000, genre: "Action", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/814380/header.jpg" },
    { id: 14, title: "Forza Horizon 5", price: 699000, genre: "Racing", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1551360/header.jpg" },
    { id: 15, title: "Dying Light 2", price: 849000, genre: "Zombies", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/534380/header.jpg" },
    { id: 16, title: "Stardew Valley", price: 115999, genre: "Simulator", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/413150/header.jpg" },
    { id: 17, title: "Black Myth: Wukong", price: 699000, genre: "Action", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2358720/header.jpg" },
    { id: 18, title: "Street Fighter 6", price: 830999, genre: "Fighting", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1364780/header.jpg" },
    { id: 19, title: "Tekken 8", price: 999000, genre: "Fighting", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1778820/header.jpg" },
    { id: 20, title: "Monster Hunter Wilds", price: 899000, genre: "RPG", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2246340/header.jpg" },
    { id: 21, title: "The Witcher 3: Wild Hunt", price: 360000, genre: "RPG", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/292030/header.jpg" },
    { id: 22, title: "Horizon Zero Dawn", price: 729000, genre: "Open World", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1151640/header.jpg" },
    { id: 23, title: "Call of Duty: Black Ops 6", price: 1000000, genre: "FPS", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2933620/header.jpg" },
    { id: 24, title: "Minecraft Dungeons", price: 280000, genre: "Adventure", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1672970/header.jpg" },
    { id: 25, title: "Assassin's Creed Mirage", price: 589000, genre: "Stealth", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2892180/header.jpg" },
    { id: 26, title: "Starfield", price: 1000000, genre: "Sci-Fi", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1716740/header.jpg" },
    { id: 27, title: "EA SPORTS FC 25", price: 759000, genre: "Sports", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2669320/header.jpg" },
    { id: 28, title: "Persona 5 Royal", price: 798000, genre: "JRPG", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1687950/header.jpg" },
    { id: 29, title: "Dark Souls III", price: 587000, genre: "Action", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/374320/header.jpg" },
    { id: 30, title: "Terraria", price: 90000, genre: "Sandbox", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/105600/header.jpg" }
];

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

app.post('/api/login', async (req, res) => {
    const user = users.find(u => u.username === req.body.username);
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
        return res.status(401).send();
    }
    const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
});

app.get('/api/games', authenticateToken, (req, res) => {
    res.json(games);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Active on ${PORT}`));