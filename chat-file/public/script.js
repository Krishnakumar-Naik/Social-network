let username = '';

function login() {
    username = document.getElementById('username').value.trim();
    if (!username) return alert('Please enter a username');

    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('login-section').classList.add('d-none');
            document.getElementById('chat-section').classList.remove('d-none');
            loadChatMessages();
            setInterval(loadChatMessages, 3000);
        }
    })
    .catch(error => console.error('Error logging in:', error));
}

async function loadChatMessages() {
    try {
        const response = await fetch("http://localhost:4000/get-chat-messages");
        const data = await response.json();
        
        console.log("Fetched Messages:", data);  // Debugging

        if (!Array.isArray(data)) {
            console.error("Invalid response format:", data);
            return;
        }

        const chatBox = document.getElementById("chat-box");
        chatBox.innerHTML = ""; // Clear previous messages

        data.forEach((msg) => {
            const messageElement = document.createElement("div");
            messageElement.className = "chat-message";
            messageElement.innerHTML = `<strong>${msg.username}:</strong> ${msg.message}`;
            chatBox.appendChild(messageElement);
        });

    } catch (error) {
        console.error("Error fetching chat messages:", error);
    }
}

// Load messages every 2 seconds
setInterval(loadChatMessages, 2000);

loadChatMessages();



// Load messages every 2 seconds
setInterval(loadChatMessages, 2000);


document.getElementById('chat-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const messageInput = document.getElementById('chat-message');
    const message = messageInput.value.trim();
    if (!message) return;

    fetch('/send-chat-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',  // Important for sessions
        body: JSON.stringify({ message })
    })
    
    .then(() => {
        messageInput.value = '';
        loadChatMessages();
    })
    .catch(error => console.error('Error sending message:', error));
});
