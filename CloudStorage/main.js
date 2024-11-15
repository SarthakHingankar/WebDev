const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const PORT = 3000;

const Client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: "AKIA2RP6HZ3HX7R3AFF2",
    secretAccessKey: "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",
  },
});

async function GetImageURL(key) {
  const command = new GetObjectCommand({
    Bucket: "image-storage.v3",
    Key: key,
  });
  const URL = await getSignedUrl(Client, command);
  return URL;
}

async function imgUrl(key) {
  return await GetImageURL(`${key}/img${Math.floor(Math.random() * 250)}.jpg`);
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const req_path = parsedUrl.pathname;
  const method = req.method;

  if (req_path.startsWith("/img")) {
    handleApiRequests(req, res, req_path, method);
  } else {
    handleStaticFiles(req, res);
  }
});

async function handleApiRequests(req, res, req_path, method) {
  if (method === "GET") {
    const id = req_path.split("/").pop();
    res.writeHead(200, { "Content-Type": "text/plain" });
    const result = await imgUrl(id);
    return res.end(result);
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
