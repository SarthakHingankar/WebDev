const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const mysql = require("mysql2");
const PORT = 3000;

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

async function handleApiRequests(req, res, req_path, method) {}

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
