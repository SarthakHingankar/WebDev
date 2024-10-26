// Importing the required dependencies
const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const mysql = require("mysql2");
const PORT = 3000;

let users = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const req_path = parsedUrl.pathname;
  const method = req.method;

  if (req_path.startsWith("/users")) {
    handleApiRequests(req, res, req_path, method);
  } else {
    handleStaticFiles(req, res);
  }
});

function handleApiRequests(req, res, req_path, method) {
  if (method === "GET" && req_path === "/users") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(users));
  } else if (method === "GET" && req_path.startsWith("/users/")) {
    const id = parseInt(req_path.split("/").pop());
    const user = users.find((user) => user.id === id);
    if (user) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(user));
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "User not found" }));
    }
  } else if (method === "POST" && req_path.startsWith("/users")) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      const newUser = { id: users.length + 1, ...JSON.parse(body) };
      users.push(newUser);
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify(newUser));
    });
  } else if (method === "DELETE" && req_path.startsWith("/users/")) {
    const id = parseInt(req_path.split("/").pop());
    const index = users.findIndex((user) => user.id === id);
    if (index !== -1) {
      users.splice(index, 1);
      users.forEach((user, index) => {
        user.id = index + 1;
      });
      res.writeHead(204);
      res.end();
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "User not found" }));
    }
  } else if (method === "PUT" && req_path.startsWith("/users/")) {
    const id = parseInt(req_path.split("/").pop());
    const user = users.find((user) => user.id === id);
    if (user) {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        Object.assign(user, JSON.parse(body));
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(user));
      });
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "User not found" }));
    }
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Route not found" }));
  }
}

function handleStaticFiles(req, res) {
  let filePath = path.join(__dirname, req.url === "/" ? "index.html" : req.url);
  let extname = path.extname(filePath);

  let contentType = "text/html";
  switch (extname) {
    case ".js":
      contentType = "text/javascript";
      break;
    case ".css":
      contentType = "text/css";
      break;
    case ".json":
      contentType = "application/json";
      break;
    case ".png":
      contentType = "image/png";
      break;
    case ".jpg":
      contentType = "image/jpg";
      break;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === "ENOENT") {
        fs.readFile(
          path.join(__dirname, "404.html"),
          (error, notFoundContent) => {
            if (error) {
              res.writeHead(500, { "Content-Type": "text/html" });
              return res.end("Server Error: Could not load 404 page");
            }
            res.writeHead(404, { "Content-Type": "text/html" });
            return res.end(notFoundContent, "utf8");
          }
        );
      } else {
        res.writeHead(500, { "Content-Type": "text/html" });
        return res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf8");
    }
  });
}

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
