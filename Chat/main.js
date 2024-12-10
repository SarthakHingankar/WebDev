const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const PORT = 3000;

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("message", (msg) => {
    console.log(`Message: ${msg}`);
    io.emit("msg", msg);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

httpServer.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
