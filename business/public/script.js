let socket;
let username;
let profilePicUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiMobM3dnjg-13GqCOo9EtioNfZ-FXLiU-Ag&s"; // Default profile picture
let userLanguage = 'en'; // Default language

function joinChat() {
  const usernameInput = document.getElementById('usernameInput').value.trim();
  userLanguage = document.getElementById('languageSelect').value;

  const profilePicInput = document.getElementById('profilePicInput').files[0];
  if (profilePicInput) {
    const reader = new FileReader();
    reader.onload = function(e) {
      profilePicUrl = e.target.result;
      startChat(usernameInput);
    };
    reader.readAsDataURL(profilePicInput);
  } else {
    startChat(usernameInput);
  }
}

function startChat(usernameInput) {
  if (usernameInput) {
    username = usernameInput;

    // Hide login screen and show chatroom
    document.getElementById('login').style.display = 'none';
    document.getElementById('chatroom').style.display = 'flex';

    // Show logged-in username
    document.querySelector('#currentUser span').textContent = username;

    // Connect to the server
    socket = io();

    // Notify server about the new user
    socket.emit('user_connected', { username, profilePicUrl });

    // Listen for messages
    socket.on('message', (data) => {
      const messages = document.getElementById('messages');
      const messageElement = document.createElement('div');
      messageElement.classList.add('message');
      if (data.user === 'System') {
        messageElement.classList.add('system');
        messageElement.innerHTML = `
          <span class="username">${data.username}</span>: ${data.message}
        `;
      } else {
        messageElement.classList.add('user');
        messageElement.innerHTML = `
          <img class="profile-pic" src="${data.profilePicUrl}" alt="Profile Picture">
          <span class="username">${data.username}</span>: ${data.message}
        `;
      }
      messages.appendChild(messageElement);
      messages.scrollTop = messages.scrollHeight; // Auto-scroll to bottom
    });

    // Listen for user count updates
    socket.on('update_user_count', (count) => {
      document.getElementById('userCount').textContent = `(${count} users online)`;
    });

    // Enable pressing Enter to send messages
    document.getElementById('messageInput').addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
        sendMessage();
      }
    });
  } else {
    alert('Please enter a username.');
  }
}

function sendMessage() {
  const messageInput = document.getElementById('messageInput');
  const message = messageInput.value.trim();
  if (message) {
    socket.emit('message', { username, message, profilePicUrl });
    messageInput.value = '';
  }
}

function sendImage() {
  const imageInput = document.getElementById('imageInput');
  const file = imageInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const imageData = e.target.result;
      socket.emit('image', { username, image: imageData, profilePicUrl });
    };
    reader.readAsDataURL(file);
  }
}

function sendFile() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const fileData = e.target.result;
      socket.emit('file', { username, fileData, fileName: file.name, profilePicUrl });
    };
    reader.readAsDataURL(file);
  }
}

function leaveChat() {
  if (socket) {
    socket.emit('user_disconnected', username);
    socket.disconnect();
  }
  document.getElementById('chatroom').style.display = 'none';
  document.getElementById('login').style.display = 'block';
  document.getElementById('usernameInput').value = '';
}
