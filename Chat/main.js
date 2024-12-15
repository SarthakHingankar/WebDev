const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const secret = process.env.secretKey;
const app = express();
app.use(express.static(__dirname + "/public"));
app.use(express.json());
app.use(cookieParser());
const httpServer = createServer(app);
const io = new Server(httpServer);
const PORT = 3000;

app.get("/", (req, res) => {
  const token = req.cookies.authToken;

  if (!token) {
    console.log("No token found, redirecting to login.");
    return res.redirect("/login");
  }

  jwt.verify(token, secret, (err, decode) => {
    if (err) {
      console.log("Token verification failed:", err);
      return res.redirect("/login");
    }

    console.log("Decoded Token:", decode);
    return res.sendFile(__dirname + "/public/home.html");
  });
});

app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/public/login.html");
});

app.post("/login", (req, res) => {
  console.log(req.body);
  const user = {
    username: req.body.username,
    password: req.body.password,
  };

  const token = jwt.sign(user, secret, { expiresIn: "1h" });

  res.cookie("authToken", token, {
    httpOnly: true,
    secure: false,
    maxAge: 3600000,
  });
  res.redirect("/");
});

// app.get("/signup", (req, res) => {
//   res.sendFile(__dirname + "/public/signup.html");
// });

// app.post("/signup", (req, res) => {
//   const user = {
//     username: req.body.username,
//     email: req.body.email,
//     password: req.body.password,
//   };

//   const token = jwt.sign(user, secret, { expiresIn: "1h" });

//   res.cookie("authToken", token, {
//     httpOnly: true,
//     secure: true,
//     maxAge: 3600000,
//   });
//   res.redirect("/login");
// });

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
