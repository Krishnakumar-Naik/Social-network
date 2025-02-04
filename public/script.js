document.addEventListener('DOMContentLoaded', function() {
    const postForm = document.getElementById('create-post-form');
    const postsContainer = document.getElementById('posts-container');

    // Fetch posts from the server
    function loadPosts() {
        fetch('/posts')
            .then(response => response.json())
            .then(posts => {
                postsContainer.innerHTML = ''; // Clear current posts
                posts.forEach(post => {
                    const postElement = document.createElement('div');
                    postElement.classList.add('post');
                    postElement.innerHTML = 
                        <h3>${post.username}</h3>
                        <p>${post.message}</p>
                        <small>${new Date(post.date).toLocaleString()}</small>
                    ;
                    postsContainer.appendChild(postElement);
                });
            });
    }

    // Handle post form submission
    postForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const message = document.getElementById('message').value;

        if (username && message) {
            fetch('/add-post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: username=${encodeURIComponent(username)}&message=${encodeURIComponent(message)}
            })
            .then(response => {
                if (response.redirected) {
                    loadPosts();
                }
            });
        }
    });

    // Load posts on page load
    loadPosts();
});

