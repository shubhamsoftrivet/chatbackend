const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "https://calm-gelato-57c451.netlify.app", 
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

let activeUsers = {};
let messages = {}; 

io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  socket.on('joinRoom', ({ username, room }) => {
    socket.join(room);
    activeUsers[socket.id] = { username, room };

    if (!messages[room]) messages[room] = [];
    socket.emit('chatHistory', messages[room]); 

    io.to(room).emit('message', { username: 'System', text: `${username} has joined`, status: "join", timestamp: new Date() });
    io.to(room).emit('activeUsers', Object.values(activeUsers).filter(user => user.room === room).map(user => user.username));
  });

  socket.on('chatMessage', ({ username, text }) => {
    const user = activeUsers[socket.id];
    if (!user) return;
    const { room } = user;
    const message = { username, text, timestamp: new Date() };

    messages[room].push(message);
    io.to(room).emit('message', message);
  });

  socket.on('typing', ({ username, room }) => socket.to(room).emit('typing', username));
  socket.on('stopTyping', ({ room }) => socket.to(room).emit('typing', ''));

  socket.on('leaveRoom', ({ username, room }) => {
    delete activeUsers[socket.id];
    io.to(room).emit('message', { username: 'System', text: `${username} has left`, status: "left", timestamp: new Date() });
    io.to(room).emit('activeUsers', Object.values(activeUsers).filter(user => user.room === room).map(user => user.username));
    socket.leave(room);
  });

  socket.on('disconnect', () => {
    const disconnectedUser = activeUsers[socket.id];
    if (disconnectedUser) {
      const { username, room } = disconnectedUser;
      delete activeUsers[socket.id];
      io.to(room).emit('message', { username: 'System', text: `${username} has left`, status: "left", timestamp: new Date() });
      io.to(room).emit('activeUsers', Object.values(activeUsers).filter(user => user.room === room).map(user => user.username));
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
