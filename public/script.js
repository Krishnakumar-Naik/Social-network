document.addEventListener('DOMContentLoaded', function() { 
    const postForm = document.getElementById('create-post-form');
    const postsContainer = document.getElementById('posts-container');
    const navUsername = document.getElementById('nav-username'); // Navbar username element
    const leftSection = document.getElementById('left'); // Left section for displaying username

    let currentUsername = ''; // Store logged-in user's username

    // Fetch and display logged-in username
    fetch('/user-info')
        .then(response => response.json())
        .then(data => {
            if (data.loggedIn) {
                navUsername.textContent = `Welcome, ${data.username}`;

                // Display username in left section as well
                leftSection.innerHTML = `<b>${data.username}</b>`;
            }
        })
        .catch(error => console.error('Error fetching user info:', error));

    // Fetch and display posts
    function loadPosts() {
        fetch('/posts')
            .then(response => response.json())
            .then(posts => {
                postsContainer.innerHTML = ''; // Clear old posts
                posts.forEach(post => {
                    const postElement = document.createElement('div');
                    postElement.classList.add('post');
                    postElement.innerHTML = `
                        <p><strong>${post.username}</strong>: ${post.caption}</p>
                        ${post.image_url ? `<img src="${post.image_url}" alt="Post Image">` : ''}
                    `;
                    postsContainer.appendChild(postElement);
                });
            })
            .catch(error => console.error('Error fetching posts:', error));
    }

    // Handle post form submission
    postForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const formData = new FormData(postForm);

        fetch('/add-post', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.redirected) {
                loadPosts();
                postForm.reset();
            }
        })
        .catch(error => console.error('Error submitting post:', error));
    });

    document.addEventListener('DOMContentLoaded', function () {
        const chatBox = document.getElementById('chat-box');
        const chatForm = document.getElementById('chat-form');
        const chatMessageInput = document.getElementById('chat-message');
    
        let currentUsername = '';
    
        // Fetch logged-in user
        fetch('/user')
            .then(response => response.json())
            .then(data => {
                if (data.loggedIn) {
                    currentUsername = data.username;
                }
            })
            .catch(error => console.error('Error fetching user info:', error));
    
            document.getElementById('chat-form').addEventListener('submit', function (event) {
                event.preventDefault();
            
                const messageInput = document.getElementById('chat-message');
                const message = messageInput.value.trim();
                if (!message) return;
            
                fetch('/send-chat-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message })
                })
                .then(() => {
                    messageInput.value = ''; // Clear input
                    loadChatMessages(); // Reload messages
                })
                .catch(error => console.error('Error sending message:', error));
            });
            
        // Function to load chat messages
        function loadChatMessages() {
            fetch('/chat-messages')
                .then(response => response.json())
                .then(messages => {
                    const chatContainer = document.getElementById('chat-container');
                    chatContainer.innerHTML = ''; // Clear previous messages
        
                    messages.forEach(msg => {
                        const messageElement = document.createElement('div');
                        messageElement.classList.add('message');
                        messageElement.innerHTML = `<strong>${msg.username}:</strong> ${msg.message}`;
                        chatContainer.appendChild(messageElement);
                    });
                })
                .catch(error => console.error('Error fetching chat messages:', error));
        }
        
        // Load messages when the page loads
        document.addEventListener('DOMContentLoaded', () => {
            loadChatMessages();
            setInterval(loadChatMessages, 3000); // Auto-refresh messages every 3 seconds
        });
    
        // Handle sending chat messages
        chatForm.addEventListener('submit', function (event) {
            event.preventDefault();
            
            const message = chatMessageInput.value.trim();
            if (message === '') return;
    
            fetch('/send-chat-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUsername, message })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    chatMessageInput.value = '';
                    loadChatMessages();
                } else {
                    console.error('Message not sent:', data.error);
                }
            })
            .catch(error => console.error('Error sending chat message:', error));
        });
    
        setInterval(loadChatMessages, 3000);
        loadChatMessages();
    });
    
    
    // Load data on page load
    loadPosts();
});
