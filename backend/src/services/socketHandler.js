const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = function(io) {
  // Authentication middleware for sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (user && !user.isBanned) {
          socket.user = user;
        }
      }
      next();
    } catch (err) {
      next();
    }
  });

  // Online users tracking
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    // Track online user
    if (socket.user) {
      onlineUsers.set(socket.user._id.toString(), {
        id: socket.user._id,
        username: socket.user.username,
        avatar: socket.user.avatar,
        vipLevel: socket.user.vipLevel,
        socketId: socket.id
      });
      io.emit('onlineCount', onlineUsers.size);
    }

    // Join game rooms
    socket.on('joinGame', (gameName) => {
      socket.join(`game:${gameName}`);
    });

    socket.on('leaveGame', (gameName) => {
      socket.leave(`game:${gameName}`);
    });

    // Chat
    socket.on('chatMessage', (data) => {
      if (!socket.user) return;
      const message = {
        user: {
          id: socket.user._id,
          username: socket.user.username,
          avatar: socket.user.avatar,
          vipLevel: socket.user.vipLevel
        },
        message: data.message.substring(0, 500), // Limit message length
        room: data.room || 'global',
        timestamp: new Date()
      };
      io.to(data.room || 'global').emit('chatMessage', message);
    });

    // Join chat room
    socket.on('joinChat', (room) => {
      socket.join(room || 'global');
    });

    // Live bet feed
    socket.on('joinLiveFeed', () => {
      socket.join('liveFeed');
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (socket.user) {
        onlineUsers.delete(socket.user._id.toString());
        io.emit('onlineCount', onlineUsers.size);
      }
    });
  });

  // Broadcast functions
  io.broadcastBet = (betData) => {
    io.to('liveFeed').emit('newBet', {
      username: betData.username,
      game: betData.game,
      amount: betData.amount,
      multiplier: betData.multiplier,
      profit: betData.profit,
      timestamp: new Date()
    });
  };

  io.broadcastBigWin = (winData) => {
    io.emit('bigWin', {
      username: winData.username,
      game: winData.game,
      amount: winData.amount,
      multiplier: winData.multiplier,
      timestamp: new Date()
    });
  };

  io.notifyUser = (userId, notification) => {
    const userSocket = onlineUsers.get(userId.toString());
    if (userSocket) {
      io.to(userSocket.socketId).emit('notification', notification);
    }
  };
};
