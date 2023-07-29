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
        connectedUsers[socket.id] = nickname;
        io.emit('user connected', nickname);
        io.emit('active users', Object.values(connectedUsers));
    });

    socket.on('chat message', (msg, recipient) => {
        const nickname = connectedUsers[socket.id];
        io.emit('chat message', { nickname, msg, recipient });
    });

    socket.on('private message', ({ recipient, message }) => {
        const nickname = connectedUsers[socket.id];
        io.to(recipient).to(socket.id).emit('private message', { nickname, msg: message, recipient });
    });

    socket.on('disconnect', () => {
        const nickname = connectedUsers[socket.id];
        delete connectedUsers[socket.id];
        io.emit('user disconnected', nickname);
        io.emit('active users', Object.values(connectedUsers));
        console.log('user disconnected:', socket.id);
    });
});

const port = 3000; // Set your desired port number here
const ipAddress = '192.168.1.5'; // Replace with your local IP address

server.listen(port, ipAddress, () => {
  console.log(`Server running on http://${ipAddress}:${port}`);
});