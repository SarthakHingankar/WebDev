const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const secret = process.env.secretKey;
const app = express();
app.use(express.static(__dirname + "/public"));
const httpServer = createServer(app);
const io = new Server(httpServer);
const PORT = 3000;

app.get("/", (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  console.log(token);
  if (!token) {
    return res.redirect("/login");
  }

  jwt.verify(token, secret, (err, decode) => {
    if (err) {
      return res.redirect("/login");
    } else {
      res.sendFile(__dirname + "/public/index.html");
    }
  });
});

app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/public/login.html");
});

app.get("/signup", (req, res) => {
  res.sendFile(__dirname + "/public/signup.html");
});

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
