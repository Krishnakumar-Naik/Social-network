document.addEventListener('DOMContentLoaded', function() {
    const postForm = document.getElementById('create-post-form');
    const postsContainer = document.getElementById('posts-container');

    // Fetch and display posts
    function loadPosts() {
        fetch('/posts')
            .then(response => response.json())
            .then(posts => {
                postsContainer.innerHTML = ''; // Clear existing posts
                posts.forEach(post => {
                    const postElement = document.createElement('div');
                    postElement.classList.add('post');
                    postElement.innerHTML = `
                        <h3>${post.username}</h3>
                        <p>${post.caption}</p>
                        ${post.imageUrl ? `<img src="${post.imageUrl}" alt="Post Image" style="max-width:100%;">` : ''}
                        <small>${new Date(post.date).toLocaleString()}</small>
                    `;
                    postsContainer.appendChild(postElement);
                });
            })
            .catch(error => console.error('Error loading posts:', error));
    }

    // Handle post form submission
    postForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const formData = new FormData(postForm); // Use FormData for file uploads

        fetch('/add-post', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.redirected) {
                loadPosts(); // Reload posts after submission
                postForm.reset(); // Clear form fields
            }
        })
        .catch(error => console.error('Error submitting post:', error));
    });

    // Load posts on page load
    loadPosts();
});

function loadFriendRequests() {
    fetch('/friend-requests')
        .then(response => response.json())
        .then(requests => {
            const friendSection = document.getElementById('friends');
            friendSection.innerHTML = '<h2>Friend Requests</h2>';

            requests.forEach(req => {
                const requestElement = document.createElement('div');
                requestElement.innerHTML = `
                    <p>${req.sender.username} sent you a friend request</p>
                    <button onclick="respondToFriendRequest('${req.sender.username}', 'accept')">Accept</button>
                    <button onclick="respondToFriendRequest('${req.sender.username}', 'reject')">Reject</button>
                `;
                friendSection.appendChild(requestElement);
            });
        })
        .catch(error => console.error('Error fetching friend requests:', error));
}

function respondToFriendRequest(friendUsername, action) {
    fetch('/respond-friend-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendUsername, action })
    })
    .then(() => loadFriendRequests());
}

// Load friend requests on page load
document.addEventListener('DOMContentLoaded', loadFriendRequests);
