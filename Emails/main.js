const SMTPServer = require("smtp-server").SMTPServer;
const { simpleParser } = require("mailparser");
const AWS = require("aws-sdk");
require("dotenv").config();

const dynamoDB = new AWS.DynamoDB.DocumentClient({
  region: "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const saveEmail = async (mail) => {
  const email = {
    TableName: "Emails",
    Item: {
      email_id: mail.to.text,
      sender: mail.from.text,
      subject: mail.subject.text,
      body: mail.text,
      timestamp: new Date().toISOString(),
    },
  };

  try {
    await dynamoDB.put(email).promise();
    console.log("Email saved successfully!");
  } catch (err) {
    console.error("Error saving email:", err);
  }
};

const server = new SMTPServer({
  allowInsecureAuth: true,
  authOptional: true,
  onConnect(session, callback) {
    console.log("New connection from:", session.id);
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
      console.log("Email received:");
      simpleParser(email, { skipHtmlToText: true }, (err, parsed) => {
        if (err) {
          console.error("Error parsing email:", err);
          return;
        }

        saveEmail(parsed);
      });
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
