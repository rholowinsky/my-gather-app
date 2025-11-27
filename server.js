const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const { ExpressPeerServer } = require('peer');

// 1. Setup Static Files
app.use(express.static('public'));

// 2. Setup PeerJS Server (Video Signaling)
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/myapp'
});
app.use('/peerjs', peerServer);

// 3. Game State
let players = {};

io.on('connection', (socket) => {
  // Handle User Join
  socket.on('join', (data) => {
    players[socket.id] = {
      x: Math.random() * 800,
      y: Math.random() * 600,
      initials: data.initials || "??",
      peerId: data.peerId,
      id: socket.id
    };
    
    // Send state to everyone
    socket.emit('currentPlayers', players);
    socket.broadcast.emit('newPlayer', players[socket.id]);
  });

  // Handle Movement
  socket.on('move', (pos) => {
    if (players[socket.id]) {
      players[socket.id].x = pos.x;
      players[socket.id].y = pos.y;
      io.emit('playerMoved', players[socket.id]);
    }
  });

  // Handle Disconnect
  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });
});

// 4. Start Server (Render injects the PORT)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
