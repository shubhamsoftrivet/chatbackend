
// // ------------ typing stats show on frontend side 
// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');
// const mongoose = require('mongoose');
// const cors = require('cors');

// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server, {
//   cors: {
//     origin: '*',
//     methods: ['GET', 'POST']
//   }
// });

// app.use(cors());
// app.use(express.json());

// mongoose.connect('mongodb://localhost:27017/chatApp', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// }).then(() => console.log('MongoDB connected'))
//   .catch(err => console.log(err));

// const messageSchema = new mongoose.Schema({
//   username: String,
//   text: String,
//   timestamp: Date,
//   room: String
// });

// const Message = mongoose.model('Message', messageSchema);

// let activeUsers = {};

// io.on('connection', (socket) => {
//   console.log(`New client connected: ${socket.id}`);

//   socket.on('joinRoom', async ({ username, room }) => {
//     socket.join(room);
//     activeUsers[socket.id] = { username, room };
//     console.log(`${username} joined room: ${room}`);

//     try {
//       const messages = await Message.find({ room }).sort({ timestamp: 1 });
//       socket.emit('chatHistory', messages);
//     } catch (error) {
//       console.error('Error fetching messages:', error);
//     }

//     io.to(room).emit('message', { username: 'System', text: `${username} has joined the chat`, timestamp: new Date() });

//     const usersInRoom = Object.values(activeUsers).filter(user => user.room === room).map(user => user.username);
//     io.to(room).emit('activeUsers', usersInRoom);
//   });

//   socket.on('chatMessage', async ({ username, text }) => {
//     const user = activeUsers[socket.id];
//     if (!user) return;
    
//     const { room } = user;
//     const message = new Message({ username, text, timestamp: new Date(), room });
//     await message.save();
    
//     io.to(room).emit('message', { username, text, timestamp: new Date() });
//   });

//   socket.on('typing', ({ username, room }) => {
//     socket.to(room).emit('typing', username);
//   });

//   socket.on('stopTyping', ({ room }) => {
//     socket.to(room).emit('typing', '');
//   });

//   socket.on('disconnect', () => {
//     console.log(`Client disconnected: ${socket.id}`);
//     const disconnectedUser = activeUsers[socket.id];
//     if (disconnectedUser) {
//       const { username, room } = disconnectedUser;
//       delete activeUsers[socket.id];

//       io.to(room).emit('message', { username: 'System', text: `${username} has left the chat`, timestamp: new Date() });
      
//       const usersInRoom = Object.values(activeUsers).filter(user => user.room === room).map(user => user.username);
//       io.to(room).emit('activeUsers', usersInRoom);
//     }
//   });
// });

// const PORT = process.env.PORT || 4000;
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));






const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

let activeUsers = {};
let chatHistory = {}; // Store messages temporarily in memory

io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  socket.on('joinRoom', ({ username, room }) => {
    socket.join(room);
    activeUsers[socket.id] = { username, room };
    console.log(`${username} joined room: ${room}`);

    if (!chatHistory[room]) {
      chatHistory[room] = [];
    }
    
    socket.emit('chatHistory', chatHistory[room]);
    io.to(room).emit('message', { username: 'System', text: `${username} has joined the chat`, timestamp: new Date() });

    const usersInRoom = Object.values(activeUsers).filter(user => user.room === room).map(user => user.username);
    io.to(room).emit('activeUsers', usersInRoom);
  });

  socket.on('chatMessage', ({ username, text }) => {
    const user = activeUsers[socket.id];
    if (!user) return;
    
    const { room } = user;
    const message = { username, text, timestamp: new Date() };
    chatHistory[room].push(message);

    io.to(room).emit('message', message);
  });

  socket.on('typing', ({ username, room }) => {
    socket.to(room).emit('typing', username);
  });

  socket.on('stopTyping', ({ room }) => {
    socket.to(room).emit('typing', '');
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    const disconnectedUser = activeUsers[socket.id];
    if (disconnectedUser) {
      const { username, room } = disconnectedUser;
      delete activeUsers[socket.id];

      io.to(room).emit('message', { username: 'System', text: `${username} has left the chat`, timestamp: new Date() });
      
      const usersInRoom = Object.values(activeUsers).filter(user => user.room === room).map(user => user.username);
      io.to(room).emit('activeUsers', usersInRoom);
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  