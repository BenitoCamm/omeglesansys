const { Server } = require("socket.io");

const io = new Server({
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let availablePartners = [];

io.on("connection", (socket) => {
  console.log('A user connected: ' + socket.id);

  socket.on('message', (message) => {
    io.emit('message', message, socket.id);
  });

  socket.on('findPartner', () => {
    if (availablePartners.length > 0) {
      // Pair the current socket with the first available partner
      const partnerSocketId = availablePartners.shift();
      const partnerSocket = io.sockets.sockets.get(partnerSocketId);

      if (partnerSocket) {
        socket.emit('partnerFound');
        partnerSocket.emit('partnerFound');
        console.log(`Matched ${socket.id} with ${partnerSocketId}`);
      } else {
        // The partner is no longer available
        socket.emit('noPartnersAvailable');
      }
    } else {
      // Add the current socket to the list of available partners
      availablePartners.push(socket.id);
      socket.emit('noPartnersAvailable');
      console.log(`Added ${socket.id} to available partners`);
    }
  });

  socket.on('offer', (offer) => {
    socket.broadcast.emit('offer', offer);
  });

  socket.on('answer', (answer) => {
    socket.broadcast.emit('answer', answer);
  });

  socket.on('iceCandidate', (candidate) => {
    socket.broadcast.emit('iceCandidate', candidate);
  });

  socket.on('startCall', () => {
    socket.broadcast.emit('startCall');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected: ' + socket.id);

    // Remove the socket from availablePartners if it exists there
    availablePartners = availablePartners.filter(partnerId => partnerId !== socket.id);
  });
});

io.listen(3000);
console.log('Server listening on port 3000');

