document.addEventListener('DOMContentLoaded', function () {
    const postForm = document.getElementById('create-post-form');
    const postsContainer = document.getElementById('posts-container');
    const navUsername = document.getElementById('nav-username'); 
    const friendRequestsContainer = document.getElementById('friend-requests');
    const friendsListContainer = document.getElementById('friends-list');
    const friendRequestForm = document.getElementById('send-friend-request');
    const friendUsernameInput = document.getElementById('friend-username');

    let currentUsername = ''; // Store logged-in user's username

    // Fetch and display logged-in username
    fetch('/user')
        .then(response => response.json())
        .then(data => {
            if (data.loggedIn) {
                currentUsername = data.username;
                navUsername.textContent = `Welcome, ${currentUsername}`;//disply username in nav
            }
        })
        .catch(error => console.error('Error fetching user info:', error));

    // Fetch and display posts
    function loadPosts() {
        fetch('/posts')
            .then(response => response.json())
            .then(posts => {
                postsContainer.innerHTML = ''; 
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
    postForm.addEventListener('submit', function (event) {
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

    // Fetch and display friend requests
    function loadFriendRequests() {
        fetch('/friend-requests')
            .then(response => response.json())
            .then(requests => {
                friendRequestsContainer.innerHTML = ''; 
                requests.forEach(req => {
                    const requestElement = document.createElement('li');
                    requestElement.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
                    requestElement.innerHTML = `
                        <span>${req.username} sent you a friend request</span>
                        <div>
                            <button class="btn btn-success btn-sm accept-request" data-id="${req.id}">Accept</button>
                            <button class="btn btn-danger btn-sm reject-request" data-id="${req.id}">Reject</button>
                        </div>
                    `;
                    friendRequestsContainer.appendChild(requestElement);
                });

                // Handle accept/reject actions
                document.querySelectorAll('.accept-request').forEach(button => {
                    button.addEventListener('click', function () {
                        handleFriendRequest(this.dataset.id, 'accept');
                    });
                });

                document.querySelectorAll('.reject-request').forEach(button => {
                    button.addEventListener('click', function () {
                        handleFriendRequest(this.dataset.id, 'reject');
                    });
                });
            })
            .catch(error => console.error('Error fetching friend requests:', error));
    }

    // Handle friend request accept/reject
    function handleFriendRequest(requestId, action) {
        fetch(`/friend-request/${requestId}/${action}`, {
            method: 'POST'
        })
            .then(() => {
                loadFriendRequests();
                loadFriendsList();
            })
            .catch(error => console.error(`Error processing ${action} request:`, error));
    }

    // Fetch and display friends list
    function loadFriendsList() {
        fetch('/friends')
            .then(response => response.json())
            .then(friends => {
                friendsListContainer.innerHTML = ''; 
                friends.forEach(friend => {
                    const friendElement = document.createElement('li');
                    friendElement.classList.add('list-group-item');
                    friendElement.textContent = friend.username;
                    friendsListContainer.appendChild(friendElement);
                });
            })
            .catch(error => console.error('Error fetching friends:', error));
    }

    // Handle sending friend request
    friendRequestForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const username = friendUsernameInput.value.trim();
        if (username === '' || username === currentUsername) {
            alert('Invalid username.');
            return;
        }

        fetch('/send-friend-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Friend request sent!');
                    friendUsernameInput.value = ''; 
                } else {
                    alert('Error sending friend request.');
                }
            })
            .catch(error => console.error('Error sending friend request:', error));
    });

    // Load initial data
    loadPosts();
    loadFriendRequests();
    loadFriendsList();
});
