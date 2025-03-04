// initialize

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const PORT = 3000;

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Default XAMPP user
    password: '', // Default password (empty in XAMPP)
    database: 'social_network'
});

// check connection
db.connect(err => {
    if (err) {
        console.error('MySQL Connection Error: ' + err.message);
    } else {
        console.log('✅ Connected to MySQL Database');
    }
});


app.use(cors());
app.use(bodyParser.json());
// Route to fetch last 50 messages
app.get('/chat-messages', (req, res) => {
    db.query('SELECT * FROM chat_messages ORDER BY timestamp ASC', (err, results) => {
        if (err) {
            console.error('Error fetching chat messages:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json(results);
        }
    });
});

// Route to send a new chat message
app.post('/send-chat-message', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { message } = req.body;
    const userId = req.session.user;

    db.query('SELECT username FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        const username = results[0].username;

        db.query('INSERT INTO chat_messages (user_id, username, message) VALUES (?, ?, ?)',
            [userId, username, message], (err) => {
                if (err) {
                    console.error('Error inserting chat message:', err);
                    return res.status(500).json({ error: 'Database insert error' });
                }
                res.json({ success: true });
            }
        );
    });
});


app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files (CSS, JS, images)

// Session Configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));



// Multer Configuration for File Uploads
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// -------------------- ROUTES -------------------- //

// Home Page
app.get('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.sendFile(__dirname + '/index.html');
});

// Fetch Logged-in User Info
app.get('/user-info', (req, res) => {
    if (!req.session.user) {
        return res.json({ loggedIn: false });
    }

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
        if (results.length > 0) {
            return res.send('❌ Username already exists.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        db.query('INSERT INTO users (username, password) VALUES (?, ?)', 
            [username, hashedPassword], 
            (err, result) => {
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
app.post('/login', async (req, res) => {
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

    db.query('INSERT INTO posts (user_id, caption, image_url) VALUES (?, ?, ?)', 
        [userId, caption, image_url], 
        (err, result) => {
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


// -------------------- SERVER START -------------------- //
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
