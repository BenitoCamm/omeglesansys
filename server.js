
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let queue = [];
let rooms = new Map();

io.on("connection", (socket) => {
  console.log("New user connected: ", socket.id);

  queue.push(socket);

  if (queue.length >= 2) {
    const user1 = queue.shift();
    const user2 = queue.shift();
    const roomId = `${user1.id}#${user2.id}`;

    user1.join(roomId);
    user2.join(roomId);

    rooms.set(user1.id, roomId);
    rooms.set(user2.id, roomId);

    io.to(roomId).emit("chat_start");
  }

  socket.on("message", (msg) => {
    const roomId = rooms.get(socket.id);
    if (roomId) {
      socket.to(roomId).emit("message", msg);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: ", socket.id);
    const roomId = rooms.get(socket.id);
    if (roomId) {
      socket.to(roomId).emit("partner_left");
      const [id1, id2] = roomId.split("#");
      rooms.delete(id1);
      rooms.delete(id2);
    } else {
      queue = queue.filter((s) => s.id !== socket.id);
    }
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

