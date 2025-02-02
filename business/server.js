const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let connectedUsers = 0;

// Path to user logs
const logsPath = path.join(__dirname, 'userLogs.json');

// Ensure the logs file exists
if (!fs.existsSync(logsPath)) {
  fs.writeFileSync(logsPath, JSON.stringify([]));
}

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  const userIp = socket.handshake.address;
  console.log(`User connected from IP: ${userIp}`);
  connectedUsers++;
  io.emit('update_user_count', connectedUsers);

  // Handle user connection event
  socket.on('user_connected', (data) => {
    socket.username = data.username;
    socket.profilePicUrl = data.profilePicUrl;

    // Emit a system message
    io.emit('message', {
      username: 'System',
      message: `${data.username} joined the chat`,
      profilePicUrl: 'https://cdn.pixabay.com/photo/2024/05/24/16/20/processor-8785387_640.jpg',
    });

    // Log the connection
    const logEntry = {
      ip: userIp,
      username: data.username,
      timestamp: new Date().toISOString(),
      event: 'connected',
    };

    fs.readFile(logsPath, 'utf8', (err, fileData) => {
      if (err) {
        console.error('Error reading log file:', err);
        return;
      }

      const logs = JSON.parse(fileData);
      logs.push(logEntry);

      fs.writeFile(logsPath, JSON.stringify(logs, null, 2), (err) => {
        if (err) {
          console.error('Error writing to log file:', err);
        }
      });
    });
  });

  // Handle user messages
  socket.on('message', (data) => {
    io.emit('message', {
      username: data.username,
      message: data.message,
      profilePicUrl: data.profilePicUrl,
    });

    // Log the message
    const messageLog = {
      username: data.username,
      message: data.message,
      timestamp: new Date().toISOString(),
    };

    fs.readFile(logsPath, 'utf8', (err, fileData) => {
      if (err) {
        console.error('Error reading log file:', err);
        return;
      }

      const logs = JSON.parse(fileData);
      logs.push(messageLog);

      fs.writeFile(logsPath, JSON.stringify(logs, null, 2), (err) => {
        if (err) {
          console.error('Error writing to log file:', err);
        }
      });
    });
  });

  // Handle image uploads
  socket.on('image', (data) => {
    io.emit('message', {
      username: data.username,
      message: `<img src="${data.image}" alt="Image" style="max-width: 100%;">`,
      profilePicUrl: data.profilePicUrl,
    });
  });

  // Handle file uploads
  socket.on('file', (data) => {
    io.emit('message', {
      username: data.username,
      message: `<a href="${data.fileData}" download="${data.fileName}">${data.fileName}</a>`,
      profilePicUrl: data.profilePicUrl,
    });
  });

  // Handle user disconnection
  socket.on('user_disconnected', (username) => {
    io.emit('message', {
      username: 'System',
      message: `${username} left the chat`,
      profilePicUrl: 'https://cdn.pixabay.com/photo/2024/05/24/16/20/processor-8785387_640.jpg',
    });
  });

  // Handle socket disconnection
  socket.on('disconnect', () => {
    connectedUsers--;
    io.emit('update_user_count', connectedUsers);
    if (socket.username) {
      io.emit('message', {
        username: 'System',
        message: `${socket.username} disconnected`,
        profilePicUrl: 'https://cdn.pixabay.com/photo/2024/05/24/16/20/processor-8785387_640.jpg',
      });

      // Log the disconnection
      const logEntry = {
        username: socket.username,
        timestamp: new Date().toISOString(),
        event: 'disconnected',
      };

      fs.readFile(logsPath, 'utf8', (err, fileData) => {
        if (err) {
          console.error('Error reading log file:', err);
          return;
        }

        const logs = JSON.parse(fileData);
        logs.push(logEntry);

        fs.writeFile(logsPath, JSON.stringify(logs, null, 2), (err) => {
          if (err) {
            console.error('Error writing to log file:', err);
          }
        });
      });
    }
  });
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
``