const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');
const db = require('./db');
const games = require('./game-catalog.json');
require('dotenv').config();

const app = express();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '../frontend')));

const createAppToken = (user) => jwt.sign(
    {
        id: user.id,
        username: user.username,
        role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
);

const buildUsernameFromEmail = (email) => {
    if (!email || !email.includes('@')) return 'google_user';
    return email.split('@')[0];
};

const findAvailableUsername = (baseUsername, callback) => {
    db.query(
        'SELECT username FROM users WHERE username LIKE ?',
        [`${baseUsername}%`],
        (err, result) => {
            if (err) {
                callback(err);
                return;
            }

            const usedNames = new Set(result.map((item) => item.username));

            if (!usedNames.has(baseUsername)) {
                callback(null, baseUsername);
                return;
            }

            let counter = 1;
            let candidate = `${baseUsername}${counter}`;

            while (usedNames.has(candidate)) {
                counter += 1;
                candidate = `${baseUsername}${counter}`;
            }

            callback(null, candidate);
        }
    );
};

/* ===============================
   AUTH MIDDLEWARE
================================= */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            message: 'Unauthorized'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                message: 'Token invalid'
            });
        }

        req.user = user;
        next();
    });
};

/* ===============================
   ADMIN MIDDLEWARE
================================= */
const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            message: 'Forbidden: Admin only'
        });
    }

    next();
};

/* ===============================
   REGISTER USER
================================= */
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: 'Register gagal',
                    error: err.message
                });
            }

            res.json({
                message: 'Register berhasil'
            });
        }
    );
});

/* ===============================
   REGISTER ADMIN
================================= */
app.post('/api/register-admin', async (req, res) => {
    const { username, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, hashedPassword, 'admin'],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: 'Gagal membuat admin',
                    error: err.message
                });
            }

            res.json({
                message: 'Admin berhasil dibuat'
            });
        }
    );
});

/* ===============================
   LOGIN DATABASE
================================= */
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    db.query(
        'SELECT * FROM users WHERE username = ?',
        [username],
        async (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: 'Server error'
                });
            }

            if (result.length === 0) {
                return res.status(401).json({
                    message: 'User tidak ditemukan'
                });
            }

            const user = result[0];

            const validPassword = await bcrypt.compare(password, user.password);

            if (!validPassword) {
                return res.status(401).json({
                    message: 'Password salah'
                });
            }

            const token = createAppToken(user);

            res.json({
                message: 'Login berhasil',
                token
            });
        }
    );
});

app.get('/api/auth/google/config', (req, res) => {
    res.json({
        clientId: process.env.GOOGLE_CLIENT_ID || ''
    });
});

app.post('/api/auth/google', async (req, res) => {
    const { credential } = req.body;

    if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(500).json({
            message: 'GOOGLE_CLIENT_ID belum dikonfigurasi'
        });
    }

    if (!credential) {
        return res.status(400).json({
            message: 'Credential Google wajib diisi'
        });
    }

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const email = payload?.email;
        const picture = payload?.picture || '';

        if (!email) {
            return res.status(400).json({
                message: 'Email Google tidak ditemukan'
            });
        }

        const username = buildUsernameFromEmail(email);

        db.query(
            'SELECT * FROM users WHERE email = ?',
            [email],
            (selectErr, result) => {
                if (selectErr) {
                    return res.status(500).json({
                        message: 'Gagal memeriksa user Google'
                    });
                }

                if (result.length > 0) {
                    const existingUser = result[0];
                    const normalizedUser = {
                        ...existingUser,
                        username: existingUser.username || username,
                        role: existingUser.role || 'user'
                    };

                    const token = createAppToken(normalizedUser);

                    return res.json({
                        message: 'Login Google berhasil',
                        token,
                        username: normalizedUser.username,
                        email,
                        picture,
                        isNewUser: false
                    });
                }

                findAvailableUsername(username, (usernameErr, availableUsername) => {
                    if (usernameErr) {
                        return res.status(500).json({
                            message: 'Gagal menyiapkan username user Google'
                        });
                    }

                    db.query(
                        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                        [availableUsername, email, 'GOOGLE_AUTH'],
                        (insertErr, insertResult) => {
                            if (insertErr) {
                                return res.status(500).json({
                                    message: 'Gagal membuat user Google',
                                    error: insertErr.message
                                });
                            }

                            const newUser = {
                                id: insertResult.insertId,
                                username: availableUsername,
                                role: 'user'
                            };

                            const token = createAppToken(newUser);

                            return res.json({
                                message: 'Login Google berhasil',
                                token,
                                username: availableUsername,
                                email,
                                picture,
                                isNewUser: true
                            });
                        }
                    );
                });
            }
        );
    } catch (error) {
        return res.status(401).json({
            message: 'Token Google tidak valid',
            error: error.message
        });
    }
});

/* ===============================
   ADMIN ROUTE
================================= */
app.get('/api/admin', authenticateToken, adminMiddleware, (req, res) => {
    res.json({
        message: 'Welcome Admin'
    });
});

/* ===============================
   GAMES ROUTE
================================= */
app.get('/api/games', authenticateToken, (req, res) => {
    res.json(games);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

/* ===============================
   START SERVER
================================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Active on ${PORT}`));
