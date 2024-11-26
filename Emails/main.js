const SMTPServer = require("smtp-server").SMTPServer;
const { simpleParser } = require("mailparser");
const AWS = require("aws-sdk");
require("dotenv").config();

const dynamoDB = new AWS.DynamoDB.DocumentClient({
  region: "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const saveEmail = async (mail, id) => {
  const email = {
    TableName: "Emails",
    Item: {
      email_id: id,
      sender: mail.from.text || "Unknown Sender",
      receiver: mail.to.text || "Unknown Receiver",
      subject: mail.subject || "No Subject",
      body: mail.text || "No Body",
      timestamp: new Date().toISOString(),
    },
  };

  try {
    await dynamoDB.put(email).promise();
    console.log("Email saved successfully!");
  } catch (err) {
    console.error("Error saving email:", err);
    callback(new Error("Failed to parse email"));
    return;
  }
};

const queryEmail = async (user) => {
  const params = {
    TableName: "Emails",
    IndexName: "receiver",
    KeyConditionExpression: "receiver = :receiver",
    ExpressionAttributeValues: {
      ":receiver": user,
    },
    ProjectionExpression: "sender, receiver, subject, body",
    Limit: 10,
  };

  try {
    const result = await dynamoDB.query(params).promise();
    console.log("Email retrieved:", result.Items);
  } catch (err) {
    console.error("Error fetching email:", err);
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
      simpleParser(email, { skipHtmlToText: true }, (err, parsed) => {
        if (err) {
          console.error("Error parsing email:", err);
          return;
        }

        saveEmail(parsed, session.id);
      });
      callback();
    });
    stream.on("error", (err) => {
      console.error("Error receiving email:", err);
      callback(new Error("Failed to process email"));
    });
  },
});

queryEmail("Someone@testruns.icu");

const PORT = 25;
server.listen(PORT, () => {
  console.log(`SMTP server listening on port ${PORT}`);
});
