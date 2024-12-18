const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const mysql = require("mysql2");
const path = require("path");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const secret = process.env.secretKey;
const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(cookieParser());

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: process.env.databasePassword,
  database: "users",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const query = async (query, params) => {
  return new Promise((resolve, reject) => {
    pool.query(query, params, (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results);
    });
  });
};

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
      return res.redirect("/login");
    }

    return res.sendFile(path.join(__dirname, "public", "home.html"));
  });
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.post("/login", async (req, res) => {
  if (
    !(
      await query(`SELECT * FROM uid WHERE username = "${req.body.username}"`)
    )[0]
  ) {
    console.log("User not found, redirecting to signup.");
    return res.redirect("/signup");
  }

  const password = await query(
    `SELECT password FROM uid WHERE username = "${req.body.username}"`
  );
  if (password[0].password == req.body.password) {
    console.log("Logged in successfully.");
    const token = jwt.sign(req.body.username, secret);

    res.cookie("authToken", token, {
      httpOnly: true,
      secure: false,
      maxAge: 3600000,
    });
    return res.redirect("/");
  } else {
    console.log("Incorrect password, redirecting to login.");
  }
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signup.html"));
});

app.post("/signup", async (req, res) => {
  try {
    await query(
      `INSERT INTO uid (username, email, password) VALUES ("${req.body.username}", "${req.body.email}", "${req.body.password}")`
    ).then(() => {
      return res.redirect("/login");
    });
  } catch (error) {
    return res.redirect("/login");
  }
});

const userSocketMap = new Map();

io.use((socket, next) => {
  const cookies = socket.handshake.headers.cookie;
  const auth = cookies
    .split("; ")
    .find((c) => c.startsWith("authToken="))
    ?.split("=")[1];
  let uid = jwt.verify(auth, secret, (err, decoded) => {
    if (err) {
      return err;
    }
    return decoded;
  });
  userSocketMap.set(uid, socket.id);
  console.log(`User ${uid} connected.`);
  next();
});

io.on("connection", (socket) => {
  socket.on("message", ({ toUser, message }) => {
    const recipientSocketId = userSocketMap.get(toUser);

    if (recipientSocketId) {
      io.to(recipientSocketId).emit("message", message);
    } else {
      console.log(`User ${toUser} is not connected.`);
    }
  });

  socket.on("disconnect", () => {
    for (let [uid, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(uid);
        console.log(`${uid} disconnected.`);
        break;
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
