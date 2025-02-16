const express = require('express');
const mysql = require('mysql');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 4000;

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(cors());
app.use(session({
    secret: 'your_secret_key',
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
    if (err) throw err;
    console.log('✅ MySQL Connected...');
});

// User Login API
app.post('/login', (req, res) => {
    const { username } = req.body;
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (results.length === 0) {
            db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, '1234'], (err, insertResult) => {
                if (err) return res.status(500).json({ error: 'Database error' });

                req.session.user = insertResult.insertId;
                res.json({ success: true, username });
            });
        } else {
            req.session.user = results[0].id;
            res.json({ success: true, username });
        }
    });
});

// Fetch Chat Messages
app.get("/get-chat-messages", (req, res) => {
    const sql = "SELECT username, message FROM chat_messages ORDER BY timestamp ASC";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Database Fetch Error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results); // Send the correct JSON response
    });
});



// Send Chat Message
app.post('/send-chat-message', (req, res) => {
    const { message } = req.body;
    const userId = req.session.user;  // Ensure session contains user ID

    if (!userId) {
        return res.status(401).json({ error: "User not logged in" });
    }

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    const sql = "INSERT INTO chat_messages (username, message) VALUES (?, ?)";
    db.query(sql, [userId, message], (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json({ success: true });
    });
});



app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
