const SMTPServer = require("smtp-server").SMTPServer;

const server = new SMTPServer({
  onConnect(session, callback) {
    console.log("New connection from:", session.remoteAddress);
    callback();
  },
  onRcptTo(address, session, callback) {
    if (address.address.endsWith("@testruns.icu")) {
      callback();
    } else {
      callback(new Error("Recipient not allowed"));
    }
  },
  onMailFrom(address, session, callback) {
    console.log("Mail from: " + address.address);
    callback();
  },
  onData(stream, session, callback) {
    let email = "";
    stream.on("data", (chunk) => {
      email += chunk.toString();
    });
    stream.on("end", () => {
      console.log("Email received:", email);
      callback();
    });
    stream.on("error", (err) => {
      console.error("Error receiving email:", err);
      callback(new Error("Failed to process email"));
    });
  },
});

const PORT = 25;

server.listen(PORT, () => {
  console.log(`SMTP server listening on port ${PORT}`);
});
