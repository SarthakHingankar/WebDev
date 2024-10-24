const http = require("http");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2");
const PORT = 3000;

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Sarthak@17",
  database: "login",
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

const server = http.createServer((req, res) => {
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
      if (err.code == "ENOENT") {
        fs.readFile(path.join(__dirname, "404.html"), (err, content) => {
          res.writeHead(404, { "Content-Type": "${text/html}" });
          res.end(content, "utf8");
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf8");
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});

const runQuery = async () => {
  try {
    const results = await queryDatabase("SELECT * FROM users");
    console.log(results);
  } catch (error) {
    console.error("Error executing query:", error);
  }
};

runQuery();
