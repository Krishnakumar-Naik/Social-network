// server.js
const express = require('express');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const app = express();
const port = 3000;

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set up session
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}));

// In-memory "databases"
let users = [];  // Store users
let posts = [];  // Store posts
let friends = {}; // Store friends (friend requests)

// Image upload setup using Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Serve static files (for images)
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Home route
app.get('/', (req, res) => {
  if (req.session.user) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.redirect('/login');
  }
});

// Login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Signup page
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Handle user signup
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  // Check if username exists
  if (users.some(user => user.username === username)) {
    return res.send('Username already exists.');
  }

  // Hash password before storing
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, password: hashedPassword });
  res.redirect('/login');
});

// Handle user login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = users.find(user => user.username === username);
  if (!user) return res.send('User not found.');

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (isPasswordCorrect) {
    req.session.user = username; // Store the username in session
    res.redirect('/');
  } else {
    res.send('Incorrect password.');
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Post an image and caption
app.post('/add-post', upload.single('image'), (req, res) => {
  const { caption } = req.body;
  const imageUrl = req.file ? /uploads/${req.file.filename} : null;
  const username = req.session.user;

  if (username) {
    const newPost = { username, caption, imageUrl, date: new Date() };
    posts.push(newPost);
    res.redirect('/');
  } else {
    res.redirect('/login');
  }
});

// Fetch all posts
app.get('/posts', (req, res) => {
  res.json(posts);
});

// Send friend request
app.post('/add-friend', (req, res) => {
  const { friendUsername } = req.body;
  const currentUsername = req.session.user;

  if (!currentUsername || currentUsername === friendUsername) {
    return res.send('Invalid action.');
  }

  if (!friends[friendUsername]) {
    friends[friendUsername] = [];
  }

  friends[friendUsername].push({ username: currentUsername, status: 'pending' });

  res.send('Friend request sent.');
});

// Accept or reject friend request
app.post('/respond-friend-request', (req, res) => {
  const { friendUsername, action } = req.body;
  const currentUsername = req.session.user;

  if (action === 'accept') {
    // Accept the friend request
    const request = friends[friendUsername].find(req => req.username === currentUsername);
    if (request) {
      request.status = 'accepted';
    }
    res.send('Friend request accepted.');
  } else if (action === 'reject') {
    // Reject the friend request
    friends[friendUsername] = friends[friendUsername].filter(req => req.username !== currentUsername);
    res.send('Friend request rejected.');
  } else {
    res.send('Invalid action.');
  }
});

app.listen(port, () => {
  console.log(Server running at http://localhost:${port});
});