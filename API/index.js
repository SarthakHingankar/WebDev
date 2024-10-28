const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const mysql = require("mysql2");
const PORT = 3000;

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Sarthak@17",
  database: "test",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const queryDatabase = async (query, params) => {
  return new Promise((resolve, reject) => {
    pool.query(query, params, (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results);
    });
  });
};

const runQuery = async (query, params) => {
  try {
    const results = await queryDatabase(query, params);
    return JSON.stringify({ results });
  } catch (error) {
    console.error("Error executing query:", error);
    return JSON.stringify({ error });
  }
};

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

async function handleApiRequests(req, res, req_path, method) {
  if (method === "GET" && req_path === "/users") {
    res.writeHead(200, { "Content-Type": "application/json" });
    const result = await runQuery("SELECT * FROM users;");
    return res.end(result);
  } else if (method === "GET") {
    const id = parseInt(req_path.split("/").pop());
    res.writeHead(200, { "Content-Type": "application/json" });
    const result = await runQuery("SELECT * FROM users WHERE id = ?;", [id]);
    return res.end(result);
  } else if (method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      if (body.length === 0) {
        return res.end(JSON.stringify({ error: "No data received" }));
      }
      const { username, email, password } = JSON.parse(body);
      res.writeHead(201, { "Content-Type": "application/json" });
      const result = await runQuery(
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?) ;",
        [username, email, password]
      );
      return res.end(result);
    });
  } else if (method === "DELETE") {
    const id = parseInt(req_path.split("/").pop());
    res.writeHead(204);
    const result = await runQuery("DELETE FROM users WHERE id = ?;", [id]);
    return res.end();
  } else if (method === "PUT") {
    const id = parseInt(req_path.split("/").pop());
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      if (body.length === 0) {
        return res.end(JSON.stringify({ error: "No data received" }));
      }
      const { username, email, password } = JSON.parse(body);
      res.writeHead(200);
      const result = await runQuery(
        "UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?;",
        [username, email, password, id]
      );
      return res.end();
    });
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
