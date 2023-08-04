const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const connectedUsers = {};

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('setNickname', (nickname) => {
    if (!connectedUsers[socket.id]) { // Check if nickname is not already set for the socket
      connectedUsers[socket.id] = { nickname, connection: socket };
      io.emit('user connected', nickname);
      const activeUsers = Object.values(connectedUsers).map(user => user.nickname);
      io.emit('active users', activeUsers);
    }
  });

  socket.on('chat message', (msg, recipient) => {
    console.log('message: ' + msg);
    const senderNickname = connectedUsers[socket.id].nickname;
    if (recipient) {
      const recipientSocket = Object.values(connectedUsers).find(
        (user) => user.nickname === recipient
      );
      if (recipientSocket) {
        recipientSocket.connection.emit('private message', {
          nickname: senderNickname,
          msg: msg,
          recipient: recipient,
        });
        socket.emit('private message', {
          nickname: senderNickname,
          msg: msg,
          recipient: recipient,
        });
      } else {
        // Notify the sender that the recipient is not connected
        socket.emit('private message', {
          nickname: 'Server',
          msg: `User "${recipient}" not found or not connected.`,
          recipient: senderNickname,
        });
      }
    } else {
      io.emit('chat message', { nickname: senderNickname, msg: msg });
    }
  });
  


  socket.on('disconnect', () => {
    const nickname = connectedUsers[socket.id] ? connectedUsers[socket.id].nickname : null;
    delete connectedUsers[socket.id];
    if (nickname) {
      io.emit('user disconnected', nickname);
      const activeUsers = Object.values(connectedUsers).map(user => user.nickname);
      io.emit('active users', activeUsers);
      console.log('user disconnected:', socket.id);
    }
  });
});


const port = 3000;
const ipAddress = '192.168.1.5';
server.listen(port, ipAddress, () => {
  console.log(`Server running on http://${ipAddress}:${port}`);
});