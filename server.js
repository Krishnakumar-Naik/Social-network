const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Session Configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'social_network'
});

db.connect(err => {
    if (err) {
        console.error('MySQL Connection Error: ' + err.message);
    } else {
        console.log('✅ Connected to MySQL Database');
    }
});

// Multer Configuration for File Uploads
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Home Page
app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Fetch Logged-in User Details
app.get('/user', (req, res) => {
    if (!req.session.user) return res.json({ loggedIn: false });

    db.query('SELECT username FROM users WHERE id = ?', [req.session.user], (err, results) => {
        if (err) throw err;
        res.json({ loggedIn: true, username: results[0].username });
    });
});

// Signup Page
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// User Signup
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (results.length > 0) return res.send('❌ Username already exists.');

        const hashedPassword = await bcrypt.hash(password, 10);
        db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
            if (err) throw err;
            res.redirect('/login');
        });
    });
});

// Login Page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// User Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (results.length === 0) return res.send('❌ User not found.');

        const user = results[0];
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (isPasswordCorrect) {
            req.session.user = user.id;
            res.redirect('/');
        } else {
            res.send('❌ Incorrect password.');
        }
    });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// Create a Post
app.post('/add-post', upload.single('image'), (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const { caption } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    const userId = req.session.user;

    db.query('INSERT INTO posts (user_id, caption, image_url) VALUES (?, ?, ?)', [userId, caption, image_url], (err) => {
        if (err) throw err;
        res.redirect('/');
    });
});

// Fetch Posts (Feed)
app.get('/posts', (req, res) => {
    db.query(
        'SELECT users.username, posts.caption, posts.image_url, posts.created_at FROM posts JOIN users ON posts.user_id = users.id ORDER BY posts.created_at DESC',
        (err, results) => {
            if (err) throw err;
            res.json(results);
        }
    );
});

// Send Friend Request
app.post('/send-friend-request', (req, res) => {
    const { friendUsername } = req.body;
    const userId = req.session.user;

    db.query('SELECT id FROM users WHERE username = ?', [friendUsername], (err, results) => {
        if (results.length === 0) return res.json({ message: 'User not found!' });

        const friendId = results[0].id;
        db.query('INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, "pending")', [userId, friendId], (err) => {
            if (err) throw err;
            res.json({ message: 'Friend request sent!' });
        });
    });
});

// Fetch Friend Requests
app.get('/friend-requests', (req, res) => {
    const userId = req.session.user;

    db.query(
        'SELECT users.username FROM friends JOIN users ON friends.user_id = users.id WHERE friend_id = ? AND status = "pending"',
        [userId],
        (err, results) => {
            if (err) throw err;
            res.json(results);
        }
    );
});

// Accept/Ignore Friend Request
app.post('/respond-friend-request', (req, res) => {
    const { friendUsername, action } = req.body;
    const userId = req.session.user;

    db.query('SELECT id FROM users WHERE username = ?', [friendUsername], (err, results) => {
        if (results.length === 0) return res.json({ message: 'User not found!' });

        const friendId = results[0].id;
        const status = action === 'accept' ? 'accepted' : 'ignored';

        db.query('UPDATE friends SET status = ? WHERE user_id = ? AND friend_id = ?', [status, friendId, userId], (err) => {
            if (err) throw err;
            res.json({ message: `Friend request ${status}.` });
        });
    });
});

// Fetch Friends List
app.get('/friends', (req, res) => {
    const userId = req.session.user;

    db.query(
        'SELECT users.username FROM friends JOIN users ON friends.friend_id = users.id WHERE friends.user_id = ? AND status = "accepted"',
        [userId],
        (err, results) => {
            if (err) throw err;
            res.json(results);
        }
    );
});


app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
